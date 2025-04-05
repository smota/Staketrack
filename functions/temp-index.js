// Simplified Functions for Emulator Testing
const functions = require("firebase-functions");

// Simple callable function for testing
exports.testAI = functions.https.onCall((data, context) => {
  console.log("testAI function called with data:", data);
  return {
    success: true,
    message: "AI function test successful",
    timestamp: new Date().toISOString(),
    receivedData: data || {},
  };
});

// Simple callable function simulating the stakeholder recommendations
exports.generateStakeholderRecommendations = functions.https.onCall((data, context) => {
  console.log("generateStakeholderRecommendations function called");
  return {
    success: true,
    content: {
      recommendations: [
        {
          title: "Test Recommendation",
          content: "This is a test recommendation from the emulator",
        },
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        isEmulatorTest: true,
      },
    },
  };
});
