const { https, logger } = require("firebase-functions");
const functions = require('firebase-functions');

// Basic Hello World function to make sure Functions is initialized properly
exports.helloWorld = https.onRequest((request, response) => {
  logger.info("Hello request received");
  response.send("Hello from Firebase Functions!");
});

// Export the getConfig function directly from a new implementation
exports.getConfig = functions.https.onRequest((request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');
  response.set('Content-Type', 'application/json');

  if (request.method === 'OPTIONS') {
    // Handle preflight requests
    response.status(204).send('');
    return;
  }

  // Get environment from query parameter or default to production
  const env = request.query.env || 'production';
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
  const isFallback = request.query.fallback === 'true';

  logger.info(`Serving configuration for environment: ${env}, emulator: ${isEmulator}, fallback: ${isFallback}`);

  try {
    // Get Firebase config (safely)
    const firebaseConfig = functions.config();
    const appConfig = firebaseConfig.app || {};

    // Log available config keys for debugging (not values)
    const availableKeys = Object.keys(appConfig).length ?
      `Available app config keys: ${Object.keys(appConfig).join(', ')}` :
      'No app configuration found';
    logger.info(availableKeys);

    // Hard-coded configuration for development environment
    // Values for staging environment - replace with your actual Firebase project values
    // IMPORTANT: In production, these would come from secure environment settings
    const hardcodedDevConfig = {
      api_key: "AIzaSyDX_QLoBYkAX9o-_9RE4QJjZt47VrQDNFM",
      auth_domain: "staketrack-dev.firebaseapp.com",
      project_id: "staketrack-dev",
      storage_bucket: "staketrack-dev.appspot.com",
      messaging_sender_id: "376336482298",
      app_id: "1:376336482298:web:fecd532b9c13e3c94f1321",
      measurement_id: "G-XXXXXXXXXX"
    };

    // Default fallback values - only used if specific values are missing
    const defaultConfig = {
      api_key: process.env.FIREBASE_API_KEY || '',
      auth_domain: process.env.FIREBASE_AUTH_DOMAIN || '',
      project_id: process.env.FIREBASE_PROJECT_ID || '',
      storage_bucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messaging_sender_id: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      app_id: process.env.FIREBASE_APP_ID || '',
      measurement_id: process.env.FIREBASE_MEASUREMENT_ID || ''
    };

    // Select the appropriate configuration source based on environment
    let configSource;
    if (env.toLowerCase() === 'development' || env.toLowerCase() === 'dev') {
      configSource = hardcodedDevConfig;
      logger.info('Using hard-coded development configuration');
    } else {
      configSource = appConfig;
      logger.info('Using configuration from Firebase Functions config');
    }

    // Build the configuration object (without exposing sensitive data in logs)
    const config = {
      ENVIRONMENT: env.toUpperCase(),
      FIREBASE_API_KEY: configSource.api_key || defaultConfig.api_key,
      FIREBASE_AUTH_DOMAIN: configSource.auth_domain || defaultConfig.auth_domain,
      FIREBASE_PROJECT_ID: configSource.project_id || defaultConfig.project_id,
      FIREBASE_STORAGE_BUCKET: configSource.storage_bucket || defaultConfig.storage_bucket,
      FIREBASE_MESSAGING_SENDER_ID: configSource.messaging_sender_id || defaultConfig.messaging_sender_id,
      FIREBASE_APP_ID: configSource.app_id || defaultConfig.app_id,
      FIREBASE_MEASUREMENT_ID: configSource.measurement_id || defaultConfig.measurement_id,
      USE_EMULATORS: isEmulator.toString()
    };

    // Check if config has valid values for required fields
    const hasValidConfig = config.FIREBASE_API_KEY &&
      config.FIREBASE_API_KEY.length > 10 &&
      config.FIREBASE_AUTH_DOMAIN &&
      config.FIREBASE_PROJECT_ID;

    if (!hasValidConfig) {
      logger.warn('Invalid or incomplete Firebase configuration generated');
      logger.info('To configure Firebase settings, run:');
      logger.info('firebase functions:config:set app.api_key="YOUR_API_KEY" app.auth_domain="YOUR_AUTH_DOMAIN" app.project_id="YOUR_PROJECT_ID" app.storage_bucket="YOUR_STORAGE_BUCKET" app.messaging_sender_id="YOUR_MESSAGING_SENDER_ID" app.app_id="YOUR_APP_ID" app.measurement_id="YOUR_MEASUREMENT_ID"');

      // Add a flag to indicate configuration is incomplete
      config.CONFIG_INCOMPLETE = !hasValidConfig;
    }

    // Set cache control headers to minimize requests, but allow for updates
    response.set('Cache-Control', 'public, max-age=300'); // 5 minutes

    // Send the configuration
    response.json(config);
  } catch (error) {
    logger.error('Error generating configuration:', error);

    // Return a safe error response
    response.status(500).json({
      ENVIRONMENT: env.toUpperCase(),
      CONFIG_INCOMPLETE: true,
      ERROR: 'Configuration error'
    });
  }
});
