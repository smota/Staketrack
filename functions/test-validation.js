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
      path: "/staketrack-dev/europe-west1/helloWorld",
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
      port: 5001,
      path: "/staketrack-dev/europe-west1/getConfig",
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
        console.log(`Response: ${data}`);

        if (res.statusCode === 200 && data.includes("APP_ENVIRONMENT")) {
          console.log("✅ GetConfig function test PASSED");
          resolve(true);
        } else {
          console.log("❌ GetConfig function test FAILED");
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
  try {
    console.log("Starting Firebase Functions tests...");

    const helloWorldResult = await testHelloWorld();
    const getConfigResult = await testGetConfig();

    console.log("\n=== Test Summary ===");
    console.log(`HelloWorld: ${helloWorldResult ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`GetConfig: ${getConfigResult ? "✅ PASSED" : "❌ FAILED"}`);

    if (helloWorldResult && getConfigResult) {
      console.log("\n🎉 All tests passed!");
    } else {
      console.log("\n⚠️ Some tests failed. Please check the logs above.");
    }
  } catch (error) {
    console.error("Error running tests:", error);
    process.exit(1);
  }
}

// Run the tests
runTests();
