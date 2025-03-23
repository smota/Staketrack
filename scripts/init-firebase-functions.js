#!/usr/bin/env node

/**
 * Initialize Firebase Functions
 * 
 * This script creates Firebase Functions setup if not already initialized.
 * It's used to ensure that Firebase Functions config commands work properly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const env = envArg ? envArg.split('=')[1].toLowerCase() : 'dev';
const noConfirm = args.includes('--no-confirm');

// Map environment to project
const projectEnv = env === 'dev' ? 'development' : 'production';

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Execute command with error handling
 * @param {string} command - Command to execute
 * @param {boolean} silent - Whether to suppress output
 */
function executeCommand(command, silent = false) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
    return output;
  } catch (error) {
    console.log(`Command failed: ${error.message}`);
    return null;
  }
}

/**
 * Initialize Firebase Functions
 */
function initFirebaseFunctions() {
  console.log(`\n🔥 Initializing Firebase Functions for ${projectEnv} environment...`);

  // Set Firebase project for the specified environment
  executeCommand(`firebase use ${projectEnv}`);

  // Check if functions directory exists
  const functionsDir = path.join(process.cwd(), 'functions');
  if (!fs.existsSync(functionsDir)) {
    console.log('\n📁 Creating functions directory...');
    fs.mkdirSync(functionsDir, { recursive: true });
  }

  // Check if package.json exists in functions directory
  const packageJsonPath = path.join(functionsDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('\n📄 Creating functions/package.json...');

    // Create basic package.json for functions
    const packageJson = {
      name: "functions",
      description: "Cloud Functions for Firebase",
      scripts: {
        "serve": "firebase emulators:start --only functions",
        "shell": "firebase functions:shell",
        "start": "npm run shell",
        "deploy": "firebase deploy --only functions",
        "logs": "firebase functions:log"
      },
      engines: {
        "node": "16"
      },
      main: "index.js",
      dependencies: {
        "firebase-admin": "^11.8.0",
        "firebase-functions": "^4.3.1"
      },
      devDependencies: {
        "firebase-functions-test": "^3.1.0"
      },
      private: true
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  // Check if index.js exists in functions directory
  const indexJsPath = path.join(functionsDir, 'index.js');
  if (!fs.existsSync(indexJsPath)) {
    console.log('\n📄 Creating functions/index.js...');

    // Create basic index.js for functions
    const indexJs = `const functions = require("firebase-functions");

// Basic Hello World function to make sure Functions is initialized properly
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase Functions!");
});

// Import other function modules
exports.config = require("./getConfig.js");
`;

    fs.writeFileSync(indexJsPath, indexJs);
  }

  // Copy the getConfig.js file if it doesn't exist
  const getConfigPath = path.join(functionsDir, 'getConfig.js');
  const sourceConfigPath = path.join(process.cwd(), 'functions', 'getConfig.js');

  if (!fs.existsSync(getConfigPath) && fs.existsSync(sourceConfigPath)) {
    console.log('\n📄 Copying getConfig.js to functions directory...');
    fs.copyFileSync(sourceConfigPath, getConfigPath);
  }

  console.log('\n✅ Firebase Functions initialized successfully!');
  console.log('\nYou can now run:');
  console.log('  npm run firebase:update-config:dev');
  console.log('  npm run firebase:update-config:prod');
  console.log('\nTo deploy Firebase Functions:');
  console.log('  npm run deploy:functions:dev');
  console.log('  npm run deploy:functions:prod');
}

/**
 * Confirm initialization with user
 */
function confirmInit() {
  if (noConfirm) {
    initFirebaseFunctions();
    rl.close();
    return;
  }

  rl.question(`\n⚠️ Are you sure you want to initialize Firebase Functions for ${projectEnv} environment? (y/n) `, (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      initFirebaseFunctions();
    } else {
      console.log('Initialization cancelled.');
    }
    rl.close();
  });
}

// Check if Firebase CLI is installed
try {
  executeCommand('firebase --version', true);
} catch (error) {
  console.error('Firebase CLI is not installed. Please install it with npm install -g firebase-tools');
  process.exit(1);
}

// Authenticate with Firebase if needed
try {
  executeCommand('firebase projects:list', true);
} catch (error) {
  console.log('\n🔑 Firebase authentication required...');
  executeCommand('firebase login');
}

// Start initialization process
confirmInit(); 