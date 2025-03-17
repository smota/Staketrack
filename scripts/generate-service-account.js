#!/usr/bin/env node

/**
 * Firebase service account key generation script
 * Generates service account keys for CI/CD
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

// Parse command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const env = envArg ? envArg.split('=')[1].toUpperCase() : null;

// Validate environment
if (!env || (env !== 'DEV' && env !== 'PRD')) {
  console.error('Please specify a valid environment with --env=DEV or --env=PRD');
  process.exit(1);
}

// Get project ID based on environment
const projectId = env === 'DEV' ? 
  'staketrack-dev' : 
  'staketrack-prod';

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
 * Generate service account key
 * @param {string} projectId - Firebase project ID
 * @param {string} env - Environment (DEV/PRD)
 */
function generateServiceAccountKey(projectId, env) {
  const serviceAccountName = `github-action-${Date.now()}`;
  const outputDir = path.join(process.cwd(), 'keys');
  const outputFile = path.join(outputDir, `firebase-${env.toLowerCase()}-key.json`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`\n🔑 Creating service account for CI/CD in ${projectId}...`);
  
  // Create service account
  executeCommand(`firebase --project=${projectId} projects:iam:serviceAccounts:create ${serviceAccountName} --display-name="GitHub Actions Deployment" --description="Service account for GitHub Actions deployment"`);
  
  // Get service account email
  const serviceAccounts = JSON.parse(executeCommand(`firebase --project=${projectId} projects:iam:serviceAccounts:list --format=json`, true));
  const serviceAccount = serviceAccounts.find(sa => sa.displayName === "GitHub Actions Deployment");
  
  if (!serviceAccount) {
    console.error('Failed to find service account');
    process.exit(1);
  }
  
  const serviceAccountEmail = serviceAccount.email;
  
  // Add roles to service account
  executeCommand(`firebase --project=${projectId} projects:iam:serviceAccounts:addRoles ${serviceAccountEmail} firebase.admin firebase.viewer`);
  
  // Create key
  executeCommand(`firebase --project=${projectId} projects:iam:serviceAccounts:keys:create --service-account=${serviceAccountEmail} --key-file=${outputFile}`);
  
  console.log(`\n✅ Service account key created at: ${outputFile}`);
  console.log('\n⚠️ IMPORTANT: Store this key securely and add it to your GitHub Secrets.');
  console.log(`For GitHub Actions, Base64 encode the key and add it as FIREBASE_SERVICE_ACCOUNT_${env}`);
  
  // Base64 encode the key for GitHub Actions
  const keyContent = fs.readFileSync(outputFile, 'utf8');
  const base64Key = Buffer.from(keyContent).toString('base64');
  
  const base64File = path.join(outputDir, `firebase-${env.toLowerCase()}-key.base64.txt`);
  fs.writeFileSync(base64File, base64Key);
  
  console.log(`\n✅ Base64 encoded key created at: ${base64File}`);
}

// Start key generation
console.log(`\n🔥 Generating service account key for ${env} environment...`);

// Authenticate with Firebase if needed
try {
  executeCommand('firebase projects:list', true);
} catch (error) {
  console.log('\n🔑 Firebase authentication required...');
  executeCommand('firebase login');
}

// Generate key
rl.question(`\n⚠️ Are you sure you want to generate a service account key for ${env} environment (${projectId})? (y/n) `, (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    generateServiceAccountKey(projectId, env);
  } else {
    console.log('Key generation cancelled.');
  }
  rl.close();
}); 