/**
 * Get environment-specific configuration
 * Provides Firebase configuration without exposing sensitive keys in client code
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });

// Define environment parameters with defaults from environment variables
const region = defineString("REGION", {
  default: process.env.REGION || "europe-west1",
});

/**
 * Get environment-specific configuration
 * Provides Firebase configuration without exposing sensitive keys in client code
 */
module.exports = onRequest({ region: region }, (request, response) => {
  cors(request, response, () => {
    try {
      // Get environment from query params
      const env = request.query.env || "local";
      const isFallback = request.query.fallback === "true";

      logger.info(`getConfig called with env: ${env}, fallback: ${isFallback}`);

      // Log environment variables for debugging
      logger.info(`Current environment variables: FIREBASE_API_KEY exists: ${!!process.env.FIREBASE_API_KEY}`);

      let config;

      // For production, use runtime config from environment variables
      // No hard-coded secrets
      if (env === "production") {
        // Production environment config
        config = {
          APP_ENVIRONMENT: "PRD",
          APP_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
          APP_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
          APP_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
          APP_FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
          APP_FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
          APP_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
          APP_FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
          APP_USE_EMULATORS: "false",
          CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY,
        };
      } else if (env === "staging") {
        // Staging environment config
        config = {
          APP_ENVIRONMENT: "STG",
          APP_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "",
          APP_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || "",
          APP_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
          APP_FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "",
          APP_FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
          APP_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "",
          APP_FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || "",
          APP_USE_EMULATORS: "false",
          CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY,
        };
      } else {
        // Local/development config
        config = {
          APP_ENVIRONMENT: env === "development" ? "DEV" : "LOCAL",
          APP_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
          APP_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
          APP_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
          APP_FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
          APP_FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
          APP_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
          APP_FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
          APP_USE_EMULATORS: env === "local" ? "true" : "false",
          CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY,
        };
      }

      // If config is incomplete and this is not a fallback request, provide minimal info
      if (config.CONFIG_INCOMPLETE && !isFallback) {
        logger.warn(`Incomplete configuration requested for ${env} environment`);

        response.status(500).json({
          error: "Configuration incomplete",
          message: "The requested configuration is incomplete. Please check Firebase Function environment variables.",
          APP_ENVIRONMENT: config.APP_ENVIRONMENT,
          CONFIG_INCOMPLETE: true,
        });
        return;
      }

      // Add timestamp for debugging
      config.TIMESTAMP = new Date().toISOString();

      // Return config
      response.json(config);
    } catch (error) {
      logger.error("Error in getConfig function:", error);
      response.status(500).json({
        error: "Server error",
        message: "An error occurred while retrieving configuration.",
        timestamp: new Date().toISOString(),
      });
    }
  });
});
