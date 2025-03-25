/**
 * StakeTrack Cloud Functions
 * Firebase Cloud Functions for secure configuration and API endpoints
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Get environment-specific configuration
 * Provides Firebase configuration without exposing sensitive keys in client code
 */
exports.getConfig = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    // Get environment from query params
    const env = request.query.env || 'local';
    const isFallback = request.query.fallback === 'true';

    let config;

    // For production, use runtime config from environment variables
    // No hard-coded secrets 
    if (env === 'production') {
      // Production environment config
      config = {
        ENVIRONMENT: 'PRD',
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
        USE_EMULATORS: 'false',
        CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY
      };
    } else if (env === 'development') {
      // Development environment config
      config = {
        ENVIRONMENT: 'DEV',
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
        USE_EMULATORS: 'false',
        CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY
      };
    } else {
      // Local development config
      config = {
        ENVIRONMENT: 'LOCAL',
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
        USE_EMULATORS: 'true',
        CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY
      };
    }

    // If config is incomplete and this is not a fallback request, provide minimal info
    if (config.CONFIG_INCOMPLETE && !isFallback) {
      functions.logger.warn(`Incomplete configuration requested for ${env} environment`);

      response.status(500).json({
        error: 'Configuration incomplete',
        message: 'The requested configuration is incomplete. Please check Firebase Function environment variables.',
        environment: config.ENVIRONMENT,
        CONFIG_INCOMPLETE: true
      });
      return;
    }

    // Add timestamp for debugging
    config.TIMESTAMP = new Date().toISOString();

    // Return config
    response.json(config);
  });
}); 