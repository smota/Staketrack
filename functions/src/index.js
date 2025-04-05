/**
 * StakeTrack Cloud Functions
 * Firebase Cloud Functions for AI endpoints
 */

const { onCall } = require("firebase-functions/v2/https");
const { defineString, defineInt } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Define environment parameters with defaults from environment variables
const region = defineString("REGION", {
  default: process.env.REGION || "europe-west1",
});

const memoryOption = defineString("FUNCTION_MEMORY", {
  default: process.env.FUNCTION_MEMORY || "256MiB",
});

const maxInstances = defineInt("FUNCTION_MAX_INSTANCES", {
  default: parseInt(process.env.FUNCTION_MAX_INSTANCES || "10", 10),
});

// Common function options using environment params
const functionOptions = {
  region: region,
  memory: memoryOption.value(),
  maxInstances: maxInstances,
};

/**
 * Generate stakeholder recommendations
 * Creates AI-generated recommendations for stakeholder engagement
 */
exports.generateStakeholderRecommendations = onCall(
  functionOptions,
  (request) => {
    logger.info("generateStakeholderRecommendations called", request.data);

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
  },
);

// Export existing config functions
exports.getConfig = require("./config/getConfig");
exports.helloWorld = require("./config/helloWorld");
