#!/usr/bin/env node

/**
 * Firebase environment setup script
 * Sets up DEV and PRD environments in Firebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define Firebase project IDs
let devProjectId = 'staketrack-dev';
let prodProjectId = 'staketrack-prod';

/**
 * Execute command with error handling
 * @param {string} command - Shell command to execute
 * @param {boolean} silent - Whether to suppress output
 * @returns {string} Command output
 */
function executeCommand(command, silent = false) {
  try {
    console.log(`Executing: ${command}`);
    return execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8' 
    });
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    return null;
  }
}

/**
 * Check if Firebase project exists
 * @param {string} projectId - Firebase project ID
 * @returns {boolean} Whether project exists
 */
function projectExists(projectId) {
  try {
    const output = execSync(`firebase projects:list --format json`, { 
      encoding: 'utf-8', 
      stdio: 'pipe' 
    });
    const projects = JSON.parse(output);
    return projects.some(project => project.projectId === projectId);
  } catch (error) {
    console.error(`Error checking project existence: ${error.message}`);
    return false;
  }
}

/**
 * Initialize Firebase project
 * @param {string} projectId - Firebase project ID
 */
function initializeFirebaseProject(projectId) {
  // Check if project exists
  if (!projectExists(projectId)) {
    console.log(`\n🆕 Creating new Firebase project: ${projectId}`);
    executeCommand(`firebase projects:create ${projectId} --display-name "${projectId}"`);
  } else {
    console.log(`\n✅ Firebase project ${projectId} already exists`);
  }
}

/**
 * Create .firebaserc file
 */
function createFirebaseRc() {
  const firebaseRcPath = path.join(process.cwd(), '.firebaserc');
  const firebaseRcContent = {
    "projects": {
      "default": devProjectId,
      "development": devProjectId,
      "production": prodProjectId
    },
    "targets": {
      [devProjectId]: {
        "hosting": {
          "development": [
            devProjectId
          ]
        }
      },
      [prodProjectId]: {
        "hosting": {
          "production": [
            prodProjectId
          ]
        }
      }
    }
  };
  
  fs.writeFileSync(firebaseRcPath, JSON.stringify(firebaseRcContent, null, 2));
  console.log('\n✅ Created .firebaserc file');
}

/**
 * Initialize Firestore indexes
 */
function initializeFirestoreIndexes() {
  const indexesPath = path.join(process.cwd(), 'firebase', 'firestore.indexes.json');
  if (!fs.existsSync(path.dirname(indexesPath))) {
    fs.mkdirSync(path.dirname(indexesPath), { recursive: true });
  }
  
  const indexesContent = {
    "indexes": [],
    "fieldOverrides": []
  };
  
  fs.writeFileSync(indexesPath, JSON.stringify(indexesContent, null, 2));
  console.log('\n✅ Created firestore.indexes.json file');
}

/**
 * Create Firebase storage rules
 */
function createStorageRules() {
  const storageRulesPath = path.join(process.cwd(), 'firebase', 'storage.rules');
  if (!fs.existsSync(path.dirname(storageRulesPath))) {
    fs.mkdirSync(path.dirname(storageRulesPath), { recursive: true });
  }
  
  const storageRulesContent = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;
  
  fs.writeFileSync(storageRulesPath, storageRulesContent);
  console.log('\n✅ Created storage.rules file');
}

/**
 * Create npm scripts for Firebase deployment
 */
function createNpmScripts() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('\n⚠️ package.json not found. Skipping npm scripts creation.');
    return;
  }
  
  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    "firebase:setup": "node scripts/firebase-setup.js",
    "firebase:deploy": "node scripts/firebase-deploy.js",
    "deploy:dev": "node scripts/firebase-deploy.js --env=DEV --option=hosting",
    "deploy:prod": "node scripts/firebase-deploy.js --env=PRD --option=hosting",
    "deploy:rules:dev": "node scripts/firebase-deploy.js --env=DEV --option=rules",
    "deploy:rules:prod": "node scripts/firebase-deploy.js --env=PRD --option=rules",
    "deploy:all:dev": "node scripts/firebase-deploy.js --env=DEV --option=all",
    "deploy:all:prod": "node scripts/firebase-deploy.js --env=PRD --option=all",
    "emulators": "firebase emulators:start"
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('\n✅ Added Firebase deployment scripts to package.json');
}

/**
 * Main setup function
 */
function setup() {
  console.log('\n🔥 Starting Firebase environment setup...');
  
  // Authenticate with Firebase if needed
  try {
    executeCommand('firebase projects:list', true);
  } catch (error) {
    console.log('\n🔑 Firebase authentication required...');
    executeCommand('firebase login');
  }
  
  // Ask for project IDs
  rl.question(`\nDevelopment project ID (default: ${devProjectId}): `, (devId) => {
    if (devId) devProjectId = devId;
    
    rl.question(`Production project ID (default: ${prodProjectId}): `, (prodId) => {
      if (prodId) prodProjectId = prodId;
      
      // Initialize projects
      initializeFirebaseProject(devProjectId);
      initializeFirebaseProject(prodProjectId);
      
      // Create configuration files
      createFirebaseRc();
      initializeFirestoreIndexes();
      createStorageRules();
      createNpmScripts();
      
      console.log('\n🎉 Firebase environment setup completed!');
      console.log('\nYou can now use the following npm scripts:');
      console.log('- npm run deploy:dev - Deploy to development environment');
      console.log('- npm run deploy:prod - Deploy to production environment');
      console.log('- npm run deploy:rules:dev - Deploy rules to development environment');
      console.log('- npm run deploy:rules:prod - Deploy rules to production environment');
      console.log('- npm run deploy:all:dev - Deploy everything to development environment');
      console.log('- npm run deploy:all:prod - Deploy everything to production environment');
      console.log('- npm run emulators - Start Firebase emulators');
      
      rl.close();
    });
  });
}

// Run setup
setup(); 