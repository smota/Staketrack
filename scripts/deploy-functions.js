const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Get target environment from command line args
const targetEnv = process.argv[2];
if (!targetEnv || !['development', 'production'].includes(targetEnv)) {
  console.error('Please specify either "development" or "production"');
  process.exit(1);
}

console.log(`Deploying functions to ${targetEnv} environment`);

// Load environment variables from the appropriate .env file
const envFile = path.join(process.cwd(), `.env.${targetEnv}`);

// Load environment variables from the appropriate .env file
if (fs.existsSync(envFile)) {
  console.log(`Loading environment variables from ${envFile}`);
  const envConfig = dotenv.parse(fs.readFileSync(envFile));

  // Set Firebase config values as environment variables for the functions
  const functionsConfig = {};
  Object.entries(envConfig).forEach(([key, value]) => {
    if (key.startsWith('FIREBASE_') || key === 'ENVIRONMENT' || key === 'USE_EMULATORS') {
      // Convert to lowercase and remove FIREBASE_ prefix
      const configKey = key.toLowerCase().replace('firebase_', '');
      // Add all config under the app namespace
      functionsConfig[`app.${configKey}`] = value;
    }
  });

  try {
    // Set Firebase functions config
    if (Object.keys(functionsConfig).length > 0) {
      console.log('Setting Firebase Functions configuration...');

      // Build the config set command with proper key formatting
      const configCommands = Object.entries(functionsConfig)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');

      execSync(`firebase functions:config:set ${configCommands}`, { stdio: 'inherit' });
    }

    // Deploy the functions
    console.log('Deploying functions...');
    execSync(`firebase deploy --only functions --project ${targetEnv === 'development' ? 'staketrack-dev' : 'staketrack-prod'}`, { stdio: 'inherit' });

    console.log('Functions deployment completed successfully!');
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
} else {
  console.error(`Error: Environment file ${envFile} not found`);
  process.exit(1);
} 