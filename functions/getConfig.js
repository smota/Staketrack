/**
 * Firebase Cloud Function to securely serve Firebase configuration
 * Deploy this to Firebase Functions to securely provide environment
 * variables to your client application
 */

const functions = require('firebase-functions');

/**
 * Cloud Function that returns Firebase configuration for the client
 * Can be configured to provide different configs based on environment
 */
exports.getConfig = functions.https.onRequest((request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');

  if (request.method === 'OPTIONS') {
    // Handle preflight requests
    response.set('Access-Control-Allow-Methods', 'GET');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    response.status(204).send('');
    return;
  }

  // Get environment from query parameter or use the one in config
  const env = request.query.env ||
    (functions.config().client && JSON.parse(functions.config().client).environment) ||
    'production';

  // Get configuration based on environment
  const config = getEnvironmentConfig(env);

  // Set cache control headers to minimize requests, but allow for updates
  response.set('Cache-Control', 'public, max-age=300'); // 5 minutes

  // Send the configuration
  response.json(config);
});

/**
 * Returns configuration based on environment
 * In a real app, these values would be stored securely in environment variables
 * or Firebase Secret Manager
 */
function getEnvironmentConfig(env) {
  // Client config from Firebase Functions config
  const clientConfig = (functions.config().client) ?
    JSON.parse(functions.config().client) :
    { environment: env.toUpperCase() };

  // Base configuration shared across environments
  const baseConfig = {
    ENVIRONMENT: env.toUpperCase()
  };

  // Environment-specific configuration
  const envConfigs = {
    production: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
      USE_EMULATORS: clientConfig.use_emulators || 'false'
    },
    staging: {
      FIREBASE_API_KEY: process.env.STAGING_FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.STAGING_FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.STAGING_FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.STAGING_FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.STAGING_FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.STAGING_FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.STAGING_FIREBASE_MEASUREMENT_ID,
      USE_EMULATORS: clientConfig.use_emulators || 'false'
    },
    development: {
      FIREBASE_API_KEY: process.env.DEV_FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.DEV_FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.DEV_FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.DEV_FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.DEV_FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.DEV_FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.DEV_FIREBASE_MEASUREMENT_ID,
      USE_EMULATORS: clientConfig.use_emulators || 'true'
    }
  };

  // Return merged configuration
  return {
    ...baseConfig,
    ...(envConfigs[env.toLowerCase()] || envConfigs.production)
  };
} 