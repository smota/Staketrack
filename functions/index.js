const { https, logger } = require("firebase-functions");
const functions = require('firebase-functions');

// Basic Hello World function to make sure Functions is initialized properly
exports.helloWorld = functions.region('europe-west1').https.onRequest((request, response) => {
  logger.info("Hello request received");
  response.send("Hello from Firebase Functions!");
});

// Export the getConfig function with improved configuration
exports.getConfig = functions.region('europe-west1').https.onRequest((request, response) => {
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

    // Build the configuration object (without exposing sensitive data in logs)
    const config = {
      ENVIRONMENT: env.toUpperCase(),
      FIREBASE_API_KEY: appConfig.api_key || process.env.FIREBASE_API_KEY || '',
      FIREBASE_AUTH_DOMAIN: appConfig.auth_domain || process.env.FIREBASE_AUTH_DOMAIN || '',
      FIREBASE_PROJECT_ID: appConfig.project_id || process.env.FIREBASE_PROJECT_ID || '',
      FIREBASE_STORAGE_BUCKET: appConfig.storage_bucket || process.env.FIREBASE_STORAGE_BUCKET || '',
      FIREBASE_MESSAGING_SENDER_ID: appConfig.messaging_sender_id || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      FIREBASE_APP_ID: appConfig.app_id || process.env.FIREBASE_APP_ID || '',
      FIREBASE_MEASUREMENT_ID: appConfig.measurement_id || process.env.FIREBASE_MEASUREMENT_ID || '',
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
