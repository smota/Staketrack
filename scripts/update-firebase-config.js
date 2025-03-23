#!/usr/bin/env node

/**
 * Update Firebase Functions Configuration from .env files
 * 
 * This script reads values from .env.development or .env.production
 * and updates the Firebase Functions configuration accordingly.
 * 
 * Usage:
 * node scripts/update-firebase-config.js --env=dev|prd [--no-confirm] [--dry-run] [--ci]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');

// Parse command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const env = envArg ? envArg.split('=')[1].toLowerCase() : null;
const dryRun = args.includes('--dry-run');
const noConfirm = args.includes('--no-confirm');
const isCi = args.includes('--ci') || process.env.CI === 'true';

// Validate environment
if (!env || !['dev', 'prd'].includes(env)) {
  console.error('Please specify a valid environment with --env=dev or --env=prd');
  process.exit(1);
}

// Map environment to .env file
const envFileName = env === 'dev' ? '.env.development' : '.env.production';
const projectEnv = env === 'dev' ? 'development' : 'production';

// Check if .env file exists
const envFilePath = path.join(process.cwd(), envFileName);
if (!fs.existsSync(envFilePath)) {
  console.error(`${envFileName} not found. Please create it in the project root.`);
  process.exit(1);
}

// Define which variables to extract from .env files and add to Firebase config
const FIREBASE_CONFIG_VARS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'USE_EMULATORS'
];

// Create readline interface for user confirmation (not needed in CI environment)
let rl;
if (!isCi && !noConfirm) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Execute Firebase command with error handling
 * @param {string} command - Firebase command to execute
 */
function executeFirebaseCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    if (!dryRun) {
      // For security, mask sensitive information in logs
      const maskedCommand = maskSensitiveInfo(command);
      console.log(`Running: ${maskedCommand}`);

      return execSync(command, { encoding: 'utf8' });
    } else {
      console.log('[DRY RUN] Command would be executed');
      return '';
    }
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Mask sensitive information for logging
 * @param {string} command - Command to mask
 * @returns {string} - Masked command
 */
function maskSensitiveInfo(command) {
  // Mask API keys, tokens, and other sensitive data
  return command.replace(/(key|token|password|secret|api[_-]?key)="([^"]{4})([^"]+)([^"]{4})"/gi,
    (match, type, prefix, middle, suffix) => `${type}="${prefix}${'*'.repeat(8)}${suffix}"`);
}

/**
 * Update Firebase Functions configuration
 */
function updateFirebaseConfig() {
  console.log(`\n🔄 Updating Firebase Functions configuration from ${envFileName}...`);

  // Determine if we need to add token parameter for CI environments
  const tokenParam = process.env.FIREBASE_TOKEN ? ` --token ${process.env.FIREBASE_TOKEN}` : '';

  // Set Firebase project for the specified environment
  executeFirebaseCommand(`firebase use ${projectEnv}${tokenParam}`);

  // Check if Firebase Functions is initialized
  try {
    executeFirebaseCommand(`firebase functions:config:get${tokenParam}`);
  } catch (error) {
    console.warn('\n⚠️ Warning: Could not retrieve Firebase Functions configuration.');
    console.warn('This may be because Firebase Functions is not initialized for this project.');
    console.warn('Skipping Firebase Functions configuration update.\n');
    console.warn('To initialize Firebase Functions, run: firebase init functions');
    return;
  }

  // Load environment variables from .env file
  const envConfig = dotenv.parse(fs.readFileSync(envFilePath));

  console.log('\n📋 Variables to be updated:');

  // Build Firebase Functions config commands
  for (const key of FIREBASE_CONFIG_VARS) {
    if (envConfig[key]) {
      // Convert the key format from FIREBASE_API_KEY to firebase.api.key
      // Firebase Functions config uses lowercase with dots
      const configKey = key.toLowerCase().replace(/_/g, '.');

      // For Firebase Functions, we should only update Functions-specific configurations
      // Firebase API keys and similar should not be set in Functions config
      if (key.startsWith('FIREBASE_') &&
        !key.includes('FUNCTIONS_') &&
        !key.includes('USE_EMULATORS')) {
        console.log(`  Skipping ${configKey} - not needed in Firebase Functions config`);
        continue;
      }

      const configValue = envConfig[key];

      // Print preview of the update (without revealing full values for sensitive data)
      let displayValue = configValue;
      if (key.includes('KEY') || key.includes('ID') || key.includes('SECRET')) {
        // Show only part of sensitive values for preview
        displayValue = `${configValue.substring(0, 3)}...${configValue.substring(configValue.length - 3)}`;
      }

      console.log(`  ${configKey} = ${displayValue}`);

      // Set Firebase Functions config
      if (!dryRun) {
        try {
          executeFirebaseCommand(`firebase functions:config:set ${configKey}="${configValue}"${tokenParam}`);
        } catch (error) {
          console.warn(`  ⚠️ Warning: Failed to set ${configKey}. Continuing with other configs.`);
        }
      }
    }
  }

  // Create a custom config section for Firebase client configuration
  if (!dryRun) {
    console.log('\n📋 Creating client config section...');
    try {
      // Create a single config object with all Firebase client settings
      const clientConfig = {};

      // Add environment
      clientConfig.environment = envConfig.ENVIRONMENT || projectEnv.toUpperCase();

      // Add use_emulators
      clientConfig.use_emulators = envConfig.USE_EMULATORS || 'false';

      // Convert to JSON string and properly escape for shell
      const clientConfigValue = JSON.stringify(clientConfig).replace(/"/g, '\\"');

      // Set it as a single config value
      executeFirebaseCommand(`firebase functions:config:set client="${clientConfigValue}"${tokenParam}`);
      console.log('  ✅ Created client config section');
    } catch (error) {
      console.warn(`  ⚠️ Warning: Failed to create client config section: ${error.message}`);
    }
  }

  // Print the current Firebase Functions config for verification
  if (!dryRun) {
    try {
      console.log('\n✅ Updated Firebase Functions configuration:');
      const currentConfig = executeFirebaseCommand(`firebase functions:config:get${tokenParam}`);
      // Print a sanitized version that removes sensitive values
      console.log(sanitizeConfigOutput(currentConfig));
    } catch (error) {
      console.warn('  ⚠️ Warning: Failed to retrieve updated configuration.');
    }
  }

  console.log(`\n✅ Firebase Functions configuration updated successfully for ${projectEnv}!`);
}

/**
 * Sanitize config output to hide sensitive values
 * @param {string} configOutput - Raw config output from Firebase
 * @returns {string} - Sanitized config output
 */
function sanitizeConfigOutput(configOutput) {
  try {
    const config = JSON.parse(configOutput);
    const sanitizedConfig = JSON.parse(JSON.stringify(config));

    // Sanitize sensitive values
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else if (typeof obj[key] === 'string' &&
          (key.includes('key') || key.includes('id') || key.includes('secret') ||
            key.includes('token') || key.includes('password'))) {
          obj[key] = `${obj[key].substring(0, 3)}...${obj[key].substring(obj[key].length - 3)}`;
        }
      }
    };

    sanitizeObject(sanitizedConfig);
    return JSON.stringify(sanitizedConfig, null, 2);
  } catch (e) {
    return 'Error parsing config output';
  }
}

/**
 * Confirm configuration update with user
 */
function confirmUpdate() {
  // Skip confirmation for CI environments or when --no-confirm is used
  if (isCi || noConfirm) {
    updateFirebaseConfig();
    if (rl) rl.close();
    return;
  }

  rl.question(`\n⚠️ Are you sure you want to update Firebase Functions config for ${projectEnv} environment? (y/n) `, (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      updateFirebaseConfig();
    } else {
      console.log('Update cancelled.');
    }
    rl.close();
  });
}

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Firebase CLI is not installed. Please install it with npm install -g firebase-tools');
  process.exit(1);
}

// Skip authentication check in CI environment as token is provided via env vars
if (!isCi) {
  // Authenticate with Firebase if needed
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
  } catch (error) {
    console.log('\n🔑 Firebase authentication required...');
    executeFirebaseCommand('firebase login');
  }
}

// Start configuration update process
confirmUpdate(); 