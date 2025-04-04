// Import Firebase Functions
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

// Set the region for all functions
const region = "europe-west1";

// Import AI functions from src/index.js
const aiService = require("./src/index");

// Export all AI functions from src/index.js
exports.generateStakeholderRecommendations = aiService.generateStakeholderRecommendations;
exports.generateStakeholderAdvice = aiService.generateStakeholderAdvice;
exports.generateInfluenceAnalysis = aiService.generateInfluenceAnalysis;

// Basic Hello World function to make sure Functions is initialized properly
exports.helloWorld = onRequest({ region }, (request, response) => {
  logger.info("Hello request received");
  response.send("Hello from Firebase Functions!");
});

// Export the getConfig function - simplified version
exports.getConfig = onRequest({ region }, (request, response) => {
  // Set CORS headers
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");
  response.set("Content-Type", "application/json");

  if (request.method === "OPTIONS") {
    // Handle preflight requests
    response.status(204).send("");
    return;
  }

  try {
    // Get environment from query parameter or default to production
    const env = request.query.env || "production";

    // Get environment variables set via firebase functions:config:set
    const runtimeConfig = process.env;
    const clientConfig = runtimeConfig && runtimeConfig.client ?
      JSON.parse(runtimeConfig.client) :
      {};
    const appConfig = runtimeConfig && runtimeConfig.app ?
      JSON.parse(runtimeConfig.app) :
      {};

    // Build response based on environment
    let config = {
      ENVIRONMENT: clientConfig.environment || env.toUpperCase(),
      TIMESTAMP: new Date().toISOString(),
    };

    // Use values from client config section
    config = {
      ...config,
      FIREBASE_API_KEY: clientConfig.firebase_api_key || "",
      FIREBASE_AUTH_DOMAIN: clientConfig.firebase_auth_domain || "",
      FIREBASE_PROJECT_ID: clientConfig.firebase_project_id || "",
      FIREBASE_STORAGE_BUCKET: clientConfig.firebase_storage_bucket || "",
      FIREBASE_MESSAGING_SENDER_ID:
        clientConfig.firebase_messaging_sender_id || "",
      FIREBASE_APP_ID: clientConfig.firebase_app_id || "",
      FIREBASE_MEASUREMENT_ID: clientConfig.firebase_measurement_id || "",
      FIREBASE_FUNCTIONS_REGION:
        clientConfig.firebase_functions_region || region,
      USE_EMULATORS: clientConfig.use_emulators || "false",
    };

    // Add AI configuration if available
    if (clientConfig.ai_enabled) {
      config.AI_ENABLED = clientConfig.ai_enabled;
      config.AI_MODEL = clientConfig.ai_model || "";
      config.AI_WEEKLY_LIMIT = clientConfig.ai_weekly_limit || "";
    }

    // Add debug info
    config.CONFIG_AVAILABLE = true;
    config.CLIENT_CONFIG_KEYS = Object.keys(clientConfig);
    config.APP_CONFIG_KEYS = Object.keys(appConfig);

    // Add information about all available config
    if (runtimeConfig) {
      config.CONFIG_SECTIONS = Object.keys(runtimeConfig);
    }

    // Set cache control headers
    response.set("Cache-Control", "public, max-age=300"); // 5 minutes

    // Send the configuration
    response.json(config);
  } catch (error) {
    // Return a safe error response
    response.status(500).json({
      ERROR: "Configuration error",
      MESSAGE: error.message,
    });
  }
});
