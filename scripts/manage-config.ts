#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

type Environment = 'local' | 'development' | 'production';

interface FirebaseConfig {
  firebase_api_key: string;
  firebase_auth_domain: string;
  firebase_project_id: string;
  firebase_storage_bucket: string;
  firebase_messaging_sender_id: string;
  firebase_app_id: string;
  firebase_measurement_id: string;
}

const PROJECT_IDS = {
  development: 'staketrack-dev',
  production: 'staketrack-prod'
} as const;

const REQUIRED_ENV_VARS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID'
];

function loadEnvFile(environment: Environment): Record<string, string> {
  const envFile = `.env.${environment}`;
  const envPath = path.join(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    console.error(`Environment file ${envFile} not found`);
    process.exit(1);
  }

  return dotenv.parse(fs.readFileSync(envPath));
}

function validateEnvVars(envVars: Record<string, string>, environment: Environment): void {
  const missingVars = REQUIRED_ENV_VARS.filter(varName => !envVars[varName]);

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables for ${environment}:`, missingVars);
    process.exit(1);
  }
}

function buildFirebaseConfig(envVars: Record<string, string>): FirebaseConfig {
  return {
    firebase_api_key: envVars.FIREBASE_API_KEY,
    firebase_auth_domain: envVars.FIREBASE_AUTH_DOMAIN,
    firebase_project_id: envVars.FIREBASE_PROJECT_ID,
    firebase_storage_bucket: envVars.FIREBASE_STORAGE_BUCKET,
    firebase_messaging_sender_id: envVars.FIREBASE_MESSAGING_SENDER_ID,
    firebase_app_id: envVars.FIREBASE_APP_ID,
    firebase_measurement_id: envVars.FIREBASE_MEASUREMENT_ID
  };
}

function updateFirebaseConfig(environment: Environment, config: FirebaseConfig): void {
  try {
    // Switch to correct Firebase project
    const projectId = PROJECT_IDS[environment as keyof typeof PROJECT_IDS];
    if (!projectId) {
      throw new Error(`Invalid environment: ${environment}`);
    }

    console.log(`Switching to Firebase project: ${projectId}`);
    execSync(`firebase use ${projectId}`, { stdio: 'inherit' });

    // Build the config set command
    const configSetCmd = Object.entries(config)
      .map(([key, value]) => `${environment}.${key}="${value}"`)
      .join(' ');

    // Update Firebase Functions config
    console.log('Setting Firebase Functions configuration...');
    execSync(`firebase functions:config:set ${configSetCmd}`, { stdio: 'inherit' });

    console.log(`✅ Successfully updated Firebase config for ${environment} environment`);
  } catch (error) {
    console.error(`❌ Error updating Firebase config for ${environment}:`, error);
    process.exit(1);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const environment = args[0] as Environment;

  if (!['development', 'production'].includes(environment)) {
    console.error('Please specify either "development" or "production"');
    process.exit(1);
  }

  console.log(`🔄 Updating Firebase configuration for ${environment} environment...`);

  // Load and validate environment variables
  const envVars = loadEnvFile(environment);
  validateEnvVars(envVars, environment);

  // Build and update Firebase config
  const config = buildFirebaseConfig(envVars);
  updateFirebaseConfig(environment, config);
}

// Run the script
main(); 