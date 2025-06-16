/**
 * Get environment-specific configuration
 * Provides Firebase configuration without exposing sensitive keys in client code
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const cors = require("cors");

// Define environment parameters using the central config
const region = defineString("REGION", {
  default: process.env.APP_FIREBASE_FUNCTIONS_REGION || "europe-west1",
});

// Set up CORS configuration based on environment
const getCorsConfig = () => {
  // Get Firebase project ID to determine environment
  const projectId = process.env.FIREBASE_PROJECT_ID || "";

  // Define allowed origins from environment variables if available
  // Format: comma-separated list of domains (e.g. "https://domain1.com,https://domain2.com")
  const configuredOrigins = process.env.ALLOWED_ORIGINS || "";
  let allowedOrigins = configuredOrigins ? configuredOrigins.split(",") : [];

  // Use default origins only if no configured origins are available
  if (allowedOrigins.length === 0) {
    if (projectId.includes("prod")) {
      // Production environment defaults
      allowedOrigins = [
        "https://staketrack-prod.web.app",
        "https://staketrack.app",
      ];
    } else if (projectId.includes("dev")) {
      // Staging environment defaults
      allowedOrigins = [
        "https://staketrack-dev.web.app",
        "https://staketrack-staging.web.app",
      ];
    } else {
      // Development/local environment defaults
      allowedOrigins = [
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8080",
      ];
    }
    logger.info(`No ALLOWED_ORIGINS configured, using defaults for environment: ${allowedOrigins.join(", ")}`);
  } else {
    logger.info(`Using configured ALLOWED_ORIGINS: ${allowedOrigins.join(", ")}`);
  }

  return cors({
    origin: allowedOrigins,
    methods: ["GET"],
    maxAge: 3600,
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
};

// Initialize CORS handler
const corsHandler = getCorsConfig();

/**
 * Get environment-specific configuration
 * Provides Firebase configuration without exposing sensitive keys in client code
 */
module.exports = onRequest({
  region: region,
  // Add rate limiting for the config endpoint
  rateLimit: {
    maxConcurrentRequests: 10,
    periodSeconds: 60,
    maxRequests: 100,
  },
}, (request, response) => {
  // Apply CORS configuration
  corsHandler(request, response, () => {
    try {
      // Get environment from query params
      const env = request.query.env || "local";
      const isFallback = request.query.fallback === "true";

      logger.info(`getConfig called with env: ${env}, fallback: ${isFallback}`);

      // Common config structure for all environments
      const config = {
        APP_ENVIRONMENT: getEnvironmentName(env),
        APP_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "",
        APP_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || "",
        APP_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
        APP_FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "",
        APP_FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
        APP_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "",
        APP_FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || "",
        APP_USE_EMULATORS: shouldUseEmulators(env),
        APP_FIREBASE_FUNCTIONS_REGION: process.env.APP_FIREBASE_FUNCTIONS_REGION || "europe-west1",
        CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY,
      };

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

/**
 * Get standardized environment name based on env parameter
 * @param {string} env - Environment name from request
 * @return {string} Standardized environment name
 */
function getEnvironmentName(env) {
  if (env === "production") return "PRD";
  if (env === "staging") return "STG";
  if (env === "development") return "DEV";
  return "LOCAL";
}

/**
 * Determine if emulators should be used based on environment
 * @param {string} env - Environment name from request
 * @return {string} "true" or "false" string value
 */
function shouldUseEmulators(env) {
  return (env === "local" || env === "development") ? "true" : "false";
}
