#!/usr/bin/env node

/**
 * Firebase deployment automation script
 * Supports DEV and PRD environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Environment options
const ENVIRONMENTS = {
  DEV: 'development',
  PRD: 'production'
};

// Deployment options
const DEPLOYMENT_OPTIONS = {
  HOSTING: 'hosting',
  FIRESTORE: 'firestore',
  FUNCTIONS: 'functions',
  STORAGE: 'storage',
  RULES: 'rules',
  ALL: 'all'
};

// Parse command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const env = envArg ? envArg.split('=')[1].toUpperCase() : null;
const optionArg = args.find(arg => arg.startsWith('--option='));
const option = optionArg ? optionArg.split('=')[1].toLowerCase() : DEPLOYMENT_OPTIONS.ALL;
const dryRun = args.includes('--dry-run');
const noConfirm = args.includes('--no-confirm');

// Validate environment
if (!env || !ENVIRONMENTS[env]) {
  console.error('Please specify a valid environment with --env=DEV or --env=PRD');
  process.exit(1);
}

// Get environment name
const environment = ENVIRONMENTS[env];

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Execute command with error handling
 * @param {string} command - Shell command to execute
 * @param {boolean} silent - Whether to suppress output
 */
function executeCommand(command, silent = false) {
  try {
    console.log(`Executing: ${command}`);
    if (!dryRun) {
      execSync(command, { stdio: silent ? 'ignore' : 'inherit' });
    } else {
      console.log('[DRY RUN] Command would be executed');
    }
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Deploy to Firebase
 * @param {string} environment - Target environment
 * @param {string} option - Deployment option
 */
function deployToFirebase(environment, option) {
  console.log(`\n🚀 Starting deployment to ${environment} environment`);

  // Set Firebase project
  executeCommand(`firebase use ${environment}`);

  // Update version before build
  console.log('\n🔄 Updating version information...');
  executeCommand(`node scripts/update-version.js minor --build=${Date.now().toString().slice(-6)}`);

  // Update Firebase Functions configuration from .env files
  console.log('\n🔧 Updating Firebase configuration from .env files...');
  const envFlag = environment === ENVIRONMENTS.DEV ? 'dev' : 'prd';
  executeCommand(`node scripts/update-firebase-config.js --env=${envFlag} --no-confirm`);

  // Build application
  const buildCmd = environment === ENVIRONMENTS.DEV ?
    'npm run build:dev' :
    'npm run build:prod';

  console.log('\n📦 Building application...');
  executeCommand(buildCmd);

  // Determine deployment command
  let deployCmd = 'firebase deploy';

  if (option !== DEPLOYMENT_OPTIONS.ALL) {
    deployCmd += ` --only ${option}`;
  }

  // Add target for hosting if needed
  if (option === DEPLOYMENT_OPTIONS.HOSTING || option === DEPLOYMENT_OPTIONS.ALL) {
    // Map environment to target
    const target = environment === ENVIRONMENTS.DEV ? 'development' : 'production';
    deployCmd += ` --only hosting:${target}`;
  }

  // Execute deployment
  console.log(`\n🔥 Deploying to Firebase (${environment})...`);
  executeCommand(deployCmd);

  console.log(`\n✅ Deployment to ${environment} completed successfully!`);
}

/**
 * Confirm deployment with user
 */
function confirmDeployment() {
  if (noConfirm) {
    deployToFirebase(environment, option);
    rl.close();
    return;
  }

  rl.question(`\n⚠️ Are you sure you want to deploy to ${environment} environment? (y/n) `, (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      deployToFirebase(environment, option);
    } else {
      console.log('Deployment cancelled.');
    }
    rl.close();
  });
}

// Run validation before deployment
console.log(`\n🔍 Validating deployment to ${environment} environment...`);

// Check if firebase.json exists
if (!fs.existsSync(path.join(process.cwd(), 'firebase.json'))) {
  console.error('firebase.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if .firebaserc exists
if (!fs.existsSync(path.join(process.cwd(), '.firebaserc'))) {
  console.error('.firebaserc not found. Please initialize Firebase first.');
  process.exit(1);
}

// Authenticate with Firebase if needed
try {
  executeCommand('firebase projects:list', true);
} catch (error) {
  console.log('\n🔑 Firebase authentication required...');
  executeCommand('firebase login');
}

// Start deployment process
confirmDeployment(); 