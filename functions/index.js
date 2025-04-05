/**
 * StakeTrack Cloud Functions
 * Main entry point for Firebase Cloud Functions
 *
 * This file serves as the primary export point for all cloud functions.
 * Implementation details are in the src/ directory.
 */

// Import functions from src directory
const aiServices = require("./src/index");

// Export all functions from the src directory
module.exports = aiServices;
