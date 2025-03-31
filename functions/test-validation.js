/**
 * Validation script for testing Firebase Functions locally
 *
 * Usage:
 * 1. Start the Firebase emulator: npm run serve
 * 2. Run this script: node test-validation.js
 */

const http = require("http");

// Test the helloWorld function
function testHelloWorld() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5001, // default emulator port
      path: "/staketrack-dev/us-central1/helloWorld",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log("\n=== HelloWorld Function Test ===");
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response: ${data}`);

        if (res.statusCode === 200 && data.includes("Hello from Firebase")) {
          console.log("✅ HelloWorld function test PASSED");
          resolve(true);
        } else {
          console.log("❌ HelloWorld function test FAILED");
          resolve(false);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error testing helloWorld function:", error);
      reject(error);
    });

    req.end();
  });
}

// Test the getConfig function
function testGetConfig() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5001, // default emulator port
      path: "/staketrack-dev/us-central1/getConfig?env=development",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log("\n=== GetConfig Function Test ===");
        console.log(`Status Code: ${res.statusCode}`);

        try {
          const parsedData = JSON.parse(data);
          console.log("Response contains fields:");
          Object.keys(parsedData).forEach((key) => {
            console.log(`- ${key}`);
          });

          if (res.statusCode === 200 && parsedData.ENVIRONMENT === "DEVELOPMENT") {
            console.log("✅ GetConfig function test PASSED");
            resolve(true);
          } else {
            console.log("❌ GetConfig function test FAILED");
            resolve(false);
          }
        } catch (e) {
          console.log(`Error parsing JSON: ${e.message}`);
          console.log(`Raw response: ${data}`);
          console.log("❌ GetConfig function test FAILED - Invalid JSON");
          resolve(false);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error testing getConfig function:", error);
      reject(error);
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log("Starting validation tests...");

  try {
    const helloResult = await testHelloWorld();
    const configResult = await testGetConfig();

    console.log("\n=== Test Summary ===");
    console.log(`HelloWorld: ${helloResult ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`GetConfig: ${configResult ? "✅ PASSED" : "❌ FAILED"}`);

    if (helloResult && configResult) {
      console.log("\n✅ All tests PASSED! The upgrade appears successful.");
    } else {
      console.log("\n❌ Some tests FAILED. Please check the logs and fix any issues.");
    }
  } catch (error) {
    console.error("Test execution error:", error);
  }
}

// Run the tests
runTests();
