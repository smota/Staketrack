#!/usr/bin/env node

/**
 * Update Firebase Functions Configuration from .env files
 *
 * This script reads values from .env.development or .env.production
 * and updates the Firebase Functions configuration accordingly.
 *
 * Usage:
 * node scripts/update-firebase-config.js --env=dev|staging|prd [--no-confirm] [--dry-run] [--ci]
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const dotenv = require('dotenv')

// Parse command line arguments
const args = process.argv.slice(2)
const envArg = args.find(arg => arg.startsWith('--env='))
const env = envArg ? envArg.split('=')[1].toLowerCase() : null
const dryRun = args.includes('--dry-run')
const noConfirm = args.includes('--no-confirm')
const isCi = args.includes('--ci') || process.env.CI === 'true'

// Validate environment
if (!env || !['dev', 'staging', 'prd'].includes(env)) {
  console.error('Please specify a valid environment with --env=dev, --env=staging or --env=prd')
  process.exit(1)
}

// Map environment to .env file
let envFileName
let projectEnv

if (env === 'dev') {
  envFileName = '.env.development'
  projectEnv = 'development'
} else if (env === 'staging') {
  envFileName = '.env.staging'
  projectEnv = 'staketrack-dev'
} else { // prd
  envFileName = '.env.production'
  projectEnv = 'production'
}

// Check if .env file exists
const envFilePath = path.join(process.cwd(), envFileName)
if (!fs.existsSync(envFilePath)) {
  console.error(`${envFileName} not found. Please create it in the project root.`)
  process.exit(1)
}

// Check for .local file with secrets
const localEnvFilePath = path.join(process.cwd(), `${envFileName}.local`)
const hasLocalEnv = fs.existsSync(localEnvFilePath)

// Define which variables to extract from .env files and add to Firebase config
const FIREBASE_CONFIG_VARS = [
  // Firebase configuration
  'VUE_APP_FIREBASE_API_KEY',
  'VUE_APP_FIREBASE_AUTH_DOMAIN',
  'VUE_APP_FIREBASE_PROJECT_ID',
  'VUE_APP_FIREBASE_STORAGE_BUCKET',
  'VUE_APP_FIREBASE_MESSAGING_SENDER_ID',
  'VUE_APP_FIREBASE_APP_ID',
  'VUE_APP_FIREBASE_MEASUREMENT_ID',
  'VUE_APP_FIREBASE_FUNCTIONS_REGION',

  // Application settings
  'VUE_APP_USE_EMULATORS',
  'VUE_APP_AI_ENABLED',
  'VUE_APP_AI_MODEL',
  'VUE_APP_AI_WEEKLY_LIMIT',

  // API Keys and secrets (usually in .local files)
  'VUE_APP_API_KEY',
  'VUE_APP_AUTH_SECRET',
  'VUE_APP_EXTERNAL_API_TOKEN',
  'VUE_APP_VERTEX_AI_API_KEY',
  'VUE_APP_OPENAI_API_KEY',
  'VUE_APP_DATABASE_URL',
  'VUE_APP_STORAGE_API_KEY'
]

// Create readline interface for user confirmation (not needed in CI environment)
let rl
if (!isCi && !noConfirm) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

/**
 * Execute Firebase command with error handling
 * @param {string} command - Firebase command to execute
 */
function executeFirebaseCommand(command) {
  try {
    console.log(`Executing: ${command}`)
    if (!dryRun) {
      // For security, mask sensitive information in logs
      const maskedCommand = maskSensitiveInfo(command)
      console.log(`Running: ${maskedCommand}`)

      return execSync(command, { encoding: 'utf8' })
    } else {
      console.log('[DRY RUN] Command would be executed')
      return ''
    }
  } catch (error) {
    console.error(`Error executing command: ${error.message}`)
    process.exit(1)
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
    (match, type, prefix, middle, suffix) => `${type}="${prefix}${'*'.repeat(8)}${suffix}"`)
}

// Helper function to check if a key contains sensitive information
function isSensitiveKey(key) {
  return key.toLowerCase().includes('key') ||
    key.toLowerCase().includes('secret') ||
    key.toLowerCase().includes('token') ||
    key.toLowerCase().includes('password') ||
    key.toLowerCase().includes('auth') ||
    key.toLowerCase().includes('api')
}

// Function to properly mask sensitive values for display
function maskSensitiveValue(key, value) {
  if (!value || typeof value !== 'string' || value.length < 8) {
    return '********'
  }

  return `${value.substring(0, 3)}...${value.substring(value.length - 3)}`
}

/**
 * Update Firebase Functions configuration
 */
function updateFirebaseConfig() {
  console.log(`\n🔄 Updating Firebase Functions configuration from ${envFileName}...`)

  // Determine if we need to add token parameter for CI environments
  const tokenParam = process.env.FIREBASE_TOKEN ? ` --token ${process.env.FIREBASE_TOKEN}` : ''

  // Set Firebase project for the specified environment
  executeFirebaseCommand(`firebase use ${projectEnv}${tokenParam}`)

  // Check if Firebase Functions is initialized
  try {
    executeFirebaseCommand(`firebase functions:config:get${tokenParam}`)
  } catch (error) {
    console.warn('\n⚠️ Warning: Could not retrieve Firebase Functions configuration.')
    console.warn('This may be because Firebase Functions is not initialized for this project.')
    console.warn('Skipping Firebase Functions configuration update.\n')
    console.warn('To initialize Firebase Functions, run: firebase init functions')
    return
  }

  // Load environment variables from .env file
  const envConfig = dotenv.parse(fs.readFileSync(envFilePath))

  // Add local secret env vars if the file exists
  if (hasLocalEnv) {
    console.log(`\n📋 Including secrets from ${envFileName}.local`)
    const localEnvConfig = dotenv.parse(fs.readFileSync(localEnvFilePath))
    // Merge the configs, with local values taking precedence
    Object.assign(envConfig, localEnvConfig)
  }

  console.log('\n📋 Variables to be updated:')

  // Build Firebase Functions config commands
  for (const key of FIREBASE_CONFIG_VARS) {
    if (envConfig[key]) {
      // Convert the key format from VUE_APP_FIREBASE_API_KEY to app.api.key or firebase.api.key
      // Firebase Functions config uses lowercase with dots
      const configKey = key.toLowerCase()
        .replace('vue_app_firebase_', 'firebase.')  // Convert VUE_APP_FIREBASE_ to firebase.
        .replace('vue_app_use_', 'app.')  // Convert VUE_APP_USE_ to app.
        .replace(/_/g, '.')  // Convert remaining underscores to dots

      // For Firebase Functions, we should only update app config, not the firebase related ones
      // Firebase API keys and similar should all go in the client config
      if (key.startsWith('VUE_APP_FIREBASE_') || key.startsWith('VUE_APP_AI_')) {
        console.log(`  Skipping ${configKey} - will include in client config section`)
        continue
      }

      const configValue = envConfig[key]

      // Print preview of the update (without revealing full values for sensitive data)
      let displayValue = configValue
      if (isSensitiveKey(key)) {
        displayValue = maskSensitiveValue(key, configValue)
      }

      console.log(`  ${configKey} = ${displayValue}`)

      // Set Firebase Functions config
      if (!dryRun) {
        try {
          executeFirebaseCommand(`firebase functions:config:set ${configKey}="${configValue}"${tokenParam}`)
        } catch (error) {
          console.warn(`  ⚠️ Warning: Failed to set ${configKey}. Continuing with other configs.`)
        }
      }
    }
  }

  // Create a custom config section for Firebase client configuration
  if (!dryRun) {
    console.log('\n📋 Creating client config section...')
    try {
      // Create a flattened client config with all values as strings
      const clientConfig = {
        'environment': envConfig.ENVIRONMENT || projectEnv.toUpperCase(),
        'use_emulators': envConfig.VUE_APP_USE_EMULATORS || 'false'
      }

      // Add Firebase configuration as string values with prefixes
      if (envConfig.VUE_APP_FIREBASE_API_KEY) {
        clientConfig['firebase_api_key'] = envConfig.VUE_APP_FIREBASE_API_KEY
        clientConfig['firebase_auth_domain'] = envConfig.VUE_APP_FIREBASE_AUTH_DOMAIN
        clientConfig['firebase_project_id'] = envConfig.VUE_APP_FIREBASE_PROJECT_ID
        clientConfig['firebase_storage_bucket'] = envConfig.VUE_APP_FIREBASE_STORAGE_BUCKET
        clientConfig['firebase_messaging_sender_id'] = envConfig.VUE_APP_FIREBASE_MESSAGING_SENDER_ID
        clientConfig['firebase_app_id'] = envConfig.VUE_APP_FIREBASE_APP_ID
        clientConfig['firebase_measurement_id'] = envConfig.VUE_APP_FIREBASE_MEASUREMENT_ID
        clientConfig['firebase_functions_region'] = envConfig.VUE_APP_FIREBASE_FUNCTIONS_REGION || 'europe-west1'
      }

      // Add AI configuration as string values
      if (envConfig.VUE_APP_AI_ENABLED) {
        clientConfig['ai_enabled'] = envConfig.VUE_APP_AI_ENABLED
        clientConfig['ai_model'] = envConfig.VUE_APP_AI_MODEL || 'gemini-1.5-pro'
        clientConfig['ai_weekly_limit'] = envConfig.VUE_APP_AI_WEEKLY_LIMIT || '10'
      }

      // Set individual config values one by one instead of as a JSON object
      for (const [key, value] of Object.entries(clientConfig)) {
        try {
          executeFirebaseCommand(`firebase functions:config:set client.${key}="${value}"${tokenParam}`)
        } catch (error) {
          console.warn(`  ⚠️ Warning: Failed to set client.${key}. Continuing with other configs.`)
        }
      }

      console.log('  ✅ Created client config section')

      // Create a secrets section for sensitive API keys and credentials
      console.log('\n📋 Setting up secrets configuration...')

      // Find all secret keys in the environment
      const secretKeys = Object.keys(envConfig).filter(key =>
        (key.startsWith('VUE_APP_') && isSensitiveKey(key)) &&
        !key.startsWith('VUE_APP_FIREBASE_') // Exclude Firebase keys already in client config
      )

      if (secretKeys.length > 0) {
        console.log(`  Found ${secretKeys.length} sensitive configuration values`)

        // Set each secret in the Firebase Functions config
        for (const key of secretKeys) {
          if (!envConfig[key]) continue

          // Convert key format for Firebase
          const configKey = `secrets.${key.toLowerCase().replace('vue_app_', '').replace(/_/g, '.')}`
          const configValue = envConfig[key]

          // Display masked value
          const displayValue = maskSensitiveValue(key, configValue)
          console.log(`  Setting ${configKey} = ${displayValue}`)

          // Set the secret
          if (!dryRun) {
            try {
              executeFirebaseCommand(`firebase functions:config:set ${configKey}="${configValue}"${tokenParam}`)
            } catch (error) {
              console.warn(`  ⚠️ Warning: Failed to set ${configKey}. Continuing with other configs.`)
            }
          }
        }

        console.log('  ✅ Secret configuration completed')
      } else {
        console.log('  No additional secrets found in environment variables')
      }
    } catch (error) {
      console.warn(`  ⚠️ Warning: Failed to create config sections: ${error.message}`)
    }
  }

  // Print the current Firebase Functions config for verification
  if (!dryRun) {
    try {
      console.log('\n✅ Updated Firebase Functions configuration:')
      const currentConfig = executeFirebaseCommand(`firebase functions:config:get${tokenParam}`)
      // Print a sanitized version that removes sensitive values
      console.log(sanitizeConfigOutput(currentConfig))
    } catch (error) {
      console.warn('  ⚠️ Warning: Failed to retrieve updated configuration.')
    }
  }

  console.log(`\n✅ Firebase Functions configuration updated successfully for ${projectEnv}!`)
}

/**
 * Sanitize config output to hide sensitive values
 * @param {string} configOutput - Raw config output from Firebase
 * @returns {string} - Sanitized config output
 */
function sanitizeConfigOutput(configOutput) {
  try {
    const config = JSON.parse(configOutput)
    const sanitizedConfig = JSON.parse(JSON.stringify(config))

    // Sanitize sensitive values
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key])
        } else if (typeof obj[key] === 'string' &&
          (key.includes('key') || key.includes('id') || key.includes('secret') ||
            key.includes('token') || key.includes('password'))) {
          obj[key] = `${obj[key].substring(0, 3)}...${obj[key].substring(obj[key].length - 3)}`
        }
      }
    }

    sanitizeObject(sanitizedConfig)
    return JSON.stringify(sanitizedConfig, null, 2)
  } catch (e) {
    return 'Error parsing config output'
  }
}

/**
 * Confirm configuration update with user
 */
function confirmUpdate() {
  // Skip confirmation for CI environments or when --no-confirm is used
  if (isCi || noConfirm) {
    updateFirebaseConfig()
    if (rl) rl.close()
    return
  }

  rl.question(`\n⚠️ Are you sure you want to update Firebase Functions config for ${projectEnv} environment? (y/n) `, (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      updateFirebaseConfig()
    } else {
      console.log('Update cancelled.')
    }
    rl.close()
  })
}

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' })
} catch (error) {
  console.error('Firebase CLI is not installed. Please install it with npm install -g firebase-tools')
  process.exit(1)
}

// Skip authentication check in CI environment as token is provided via env vars
if (!isCi) {
  // Authenticate with Firebase if needed
  try {
    execSync('firebase projects:list', { stdio: 'ignore' })
  } catch (error) {
    console.log('\n🔑 Firebase authentication required...')
    executeFirebaseCommand('firebase login')
  }
}

// Start configuration update process
confirmUpdate()
