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

  if (request.method === 'OPTIONS') {
    // Handle preflight requests
    response.set('Access-Control-Allow-Methods', 'GET');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    response.status(204).send('');
    return;
  }

  // Get environment from query parameter or default to production
  const env = request.query.env || 'production';
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

  // Configuration object that uses process.env values at runtime
  const config = {
    ENVIRONMENT: env.toUpperCase(),
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    USE_EMULATORS: isEmulator.toString()
  };

  // Set cache control headers to minimize requests, but allow for updates
  response.set('Cache-Control', 'public, max-age=300'); // 5 minutes

  // Send the configuration
  response.json(config);
});
