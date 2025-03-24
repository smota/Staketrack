const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Function to read environment file
function readEnvFile(envFile) {
  const envPath = path.join(__dirname, '..', envFile);
  if (!fs.existsSync(envPath)) {
    console.error(`Environment file ${envFile} not found`);
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    }
  });

  return envVars;
}

// Function to set Firebase config
function setFirebaseConfig(env, envVars) {
  if (!envVars) {
    console.error(`No environment variables found for ${env}`);
    return;
  }

  const config = {
    'app.api_key': envVars.FIREBASE_API_KEY,
    'app.auth_domain': envVars.FIREBASE_AUTH_DOMAIN,
    'app.project_id': envVars.FIREBASE_PROJECT_ID,
    'app.storage_bucket': envVars.FIREBASE_STORAGE_BUCKET,
    'app.messaging_sender_id': envVars.FIREBASE_MESSAGING_SENDER_ID,
    'app.app_id': envVars.FIREBASE_APP_ID,
    'app.measurement_id': envVars.FIREBASE_MEASUREMENT_ID
  };

  // Build the command
  const configSetCmd = Object.entries(config)
    .map(([key, value]) => `"${key}=${value}"`)
    .join(' ');

  try {
    console.log(`Setting Firebase config for ${env} environment...`);
    execSync(`firebase functions:config:set ${configSetCmd}`, { stdio: 'inherit' });
    console.log(`Successfully set Firebase config for ${env}`);
  } catch (error) {
    console.error(`Error setting Firebase config for ${env}:`, error);
    process.exit(1);
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const env = args[0] || 'development';

  if (!['development', 'production'].includes(env)) {
    console.error('Please specify either "development" or "production"');
    process.exit(1);
  }

  const envFile = env === 'development' ? '.env.development' : '.env.production';
  const envVars = readEnvFile(envFile);

  if (envVars) {
    setFirebaseConfig(env, envVars);
  }
}

main(); 