/**
 * StakeTrack Cloud Functions
 * Main entry point for Firebase Cloud Functions
 *
 * This file serves as the primary export point for all cloud functions.
 * Implementation details are in the src/ directory.
 */

// Load environment variables from central .env files
const fs = require("fs");
const path = require("path");

// Check if .env.functions exists, load it if it does
const envFilePath = path.resolve(__dirname, ".env.functions");
if (fs.existsSync(envFilePath)) {
  require("dotenv").config({ path: envFilePath });
  console.log("Loaded environment variables from .env.functions");
} else {
  console.warn(".env.functions not found, running load-env.js");
  require("./scripts/load-env");
}

// Import functions from src directory
const aiServices = require("./src/index");

// Export all functions from the src directory
module.exports = aiServices;
