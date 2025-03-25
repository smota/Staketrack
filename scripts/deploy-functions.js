const { execSync } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Determine which environment we're deploying to
const args = process.argv.slice(2);
const targetEnv = args[0] || 'development';
const envFile = path.resolve(`.env.${targetEnv}`);

console.log(`Deploying functions to ${targetEnv} environment`);

// Load environment variables from the appropriate .env file
if (fs.existsSync(envFile)) {
  console.log(`Loading environment variables from ${envFile}`);
  const envConfig = dotenv.parse(fs.readFileSync(envFile));

  // Set Firebase config values as environment variables for the functions
  const functionsConfig = {};
  Object.entries(envConfig).forEach(([key, value]) => {
    if (key.startsWith('FIREBASE_') || key === 'ENVIRONMENT' || key === 'USE_EMULATORS') {
      functionsConfig[key.toLowerCase()] = value;
    }
  });

  // Create Firebase functions config command
  const configCommands = Object.entries(functionsConfig)
    .map(([key, value]) => `firebase functions:config:set ${key}="${value}"`)
    .join(' && ');

  try {
    // Set Firebase functions config
    if (configCommands) {
      console.log('Setting Firebase Functions configuration...');
      execSync(configCommands, { stdio: 'inherit' });
    }

    // Deploy the functions
    console.log('Deploying functions...');
    execSync(`firebase deploy --only functions --project ${targetEnv}`, { stdio: 'inherit' });

    console.log('Functions deployment completed successfully!');
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
} else {
  console.error(`Error: Environment file ${envFile} not found`);
  process.exit(1);
} 