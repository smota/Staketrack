/**
 * Hello World Function
 * Simple function for testing and validation
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// Define environment parameters with defaults from environment variables
const region = defineString("REGION", {
  default: process.env.REGION || "europe-west1",
});

/**
 * Simple hello world function
 * Used for testing Firebase Functions deployment
 */
module.exports = onRequest({ region: region }, (request, response) => {
  logger.info("Hello request received");
  response.send("Hello from Firebase Functions!");
});
