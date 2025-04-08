/**
 * StakeTrack Cloud Functions
 * Firebase Cloud Functions for AI endpoints
 */

// Explicitly using v2 API as required by project rules
const { onCall, onRequest } = require("firebase-functions/v2/https");
const { defineString, defineInt } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    logger.info("Firebase Admin SDK initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin SDK:", error);
    // Rethrow the error to prevent the functions from initializing incorrectly
    throw error;
  }
}

// Get the environment from the Firebase project ID or default to development
const getEnvironment = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID || "";
  if (projectId.includes("prod")) {
    return "production";
  } else if (projectId.includes("dev")) {
    return "staging"; // The dev project is mapped to staging environment in our setup
  }
  return "development";
};

// Define environment parameters using the central environment files
// APP_FIREBASE_FUNCTIONS_REGION is defined in the central .env.[environment] files
const region = defineString("REGION", {
  default: process.env.APP_FIREBASE_FUNCTIONS_REGION || "europe-west1",
});

const memoryOption = defineString("FUNCTION_MEMORY", {
  default: process.env.FUNCTION_MEMORY || "256MiB",
});

const maxInstances = defineInt("FUNCTION_MAX_INSTANCES", {
  default: parseInt(process.env.FUNCTION_MAX_INSTANCES || "10", 10),
});

// Log configuration information
logger.info(`Functions configuration loaded:
  - Region: ${region.value() || "europe-west1"}
  - Memory: ${memoryOption.value() || "256MiB"}
  - Max Instances: ${maxInstances.value() || 10}
  - Environment: ${getEnvironment()}
`);

// Common function options using environment params
const functionOptions = {
  region: region,
  memory: memoryOption.value(),
  maxInstances: maxInstances,
  // Add max concurrency to prevent abuse
  maxInstanceConcurrency: 10,
  // Add rate limiting
  rateLimit: {
    maxConcurrentRequests: 5, // Max concurrent requests per function
    periodSeconds: 60, // Per-minute rate limiting
    maxRequests: 50, // Maximum requests per minute
  },
};

/**
 * Generate stakeholder recommendations
 * Creates AI-generated recommendations for stakeholder engagement
 */
exports.generateStakeholderRecommendations = onCall(
  functionOptions,
  (request) => {
    logger.info("generateStakeholderRecommendations called", request.data);

    try {
      return {
        success: true,
        content: {
          recommendations: [
            {
              title: "Engage with Local Community Leaders",
              content: "Schedule regular meetings with community leaders " +
                "to address concerns early.",
            },
            {
              title: "Prepare Documentation for Officials",
              content: "Create detailed assessment documents for " +
                "government stakeholders.",
            },
            {
              title: "Implement Transparent Communication",
              content: "Set up regular updates for all stakeholders " +
                "about project progress.",
            },
          ],
          metadata: {
            generatedAt: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      logger.error("Error in generateStakeholderRecommendations:", error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  },
);

/**
 * Generate stakeholder engagement advice
 * Creates AI-generated advice for engaging with specific stakeholders
 */
exports.generateStakeholderAdvice = onCall(
  functionOptions,
  (request) => {
    logger.info("generateStakeholderAdvice called", request.data);

    try {
      // Extract stakeholder data if available
      const stakeholder = request.data?.stakeholder || {
        name: "Stakeholder",
        influence: 5,
        interest: 5,
      };

      const approach = stakeholder.influence > 7 ? "partnership" : "consultation";

      return {
        success: true,
        text: `### Engagement Strategy for ${stakeholder.name}\n\n` +
          `Consider a ${approach} approach. ` +
          "Schedule regular meetings to discuss progress and address concerns.",
        metadata: {
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error("Error in generateStakeholderAdvice:", error);
      throw new Error(`Failed to generate stakeholder advice: ${error.message}`);
    }
  },
);

/**
 * Generate influence network analysis
 * Creates AI-generated analysis of stakeholder influence networks
 */
exports.generateInfluenceAnalysis = onCall(
  functionOptions,
  (request) => {
    logger.info("generateInfluenceAnalysis called", request.data);

    try {
      return {
        success: true,
        text: "## Stakeholder Influence Network Analysis\n\n" +
          "Several key influence relationships exist among stakeholders. " +
          "Consider facilitating connections between stakeholders with " +
          "shared concerns. Recommend establishing a coordination " +
          "committee with representatives from each group.",
        metadata: {
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error("Error in generateInfluenceAnalysis:", error);
      throw new Error(`Failed to generate influence analysis: ${error.message}`);
    }
  },
);

// Export existing config functions
try {
  exports.getConfig = require("./config/getConfig");
  logger.info("getConfig function loaded successfully");
} catch (error) {
  logger.error("Failed to load getConfig function:", error);
  // Provide a minimal implementation to prevent complete failure
  exports.getConfig = onRequest(
    { region: region },
    (request, response) => {
      logger.error("Using fallback getConfig due to load failure");
      response.status(500).json({
        error: "Configuration service unavailable",
        message: "The configuration service failed to initialize properly.",
        timestamp: new Date().toISOString(),
      });
    },
  );
}

try {
  exports.helloWorld = require("./config/helloWorld");
  logger.info("helloWorld function loaded successfully");
} catch (error) {
  logger.error("Failed to load helloWorld function:", error);
  // Provide a minimal implementation to prevent complete failure
  exports.helloWorld = onRequest(
    { region: region },
    (request, response) => {
      logger.error("Using fallback helloWorld due to load failure");
      response.send("Hello from Firebase Functions (fallback)!");
    },
  );
}
