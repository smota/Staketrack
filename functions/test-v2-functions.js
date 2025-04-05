/**
 * Test script for validating Firebase Functions v2 deployment
 */
const http = require("http");

// The region where functions are deployed
const REGION = "us-central1";

// Function to test a callable function via direct HTTP
function testCallableFunction(functionName, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5001,
      path: `/staketrack-dev/${REGION}/${functionName}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    console.log(`Testing function: ${functionName}`);
    console.log(`URL: http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);

      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(responseData);
          console.log("Response:", JSON.stringify(jsonData, null, 2));
          resolve({
            function: functionName,
            success: res.statusCode === 200,
            status: res.statusCode,
            data: jsonData,
          });
        } catch (e) {
          console.log("Raw response:", responseData);
          resolve({
            function: functionName,
            success: false,
            status: res.statusCode,
            error: e.message,
            raw: responseData,
          });
        }
      });
    });

    req.on("error", (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    const postData = JSON.stringify({ data });
    req.write(postData);
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    // First test the HTTP functions
    console.log("==== TESTING HTTP FUNCTIONS ====");

    console.log("\n==== TESTING helloWorld FUNCTION ====");
    await testHttpFunction("helloWorld");

    console.log("\n==== TESTING getConfig FUNCTION ====");
    await testHttpFunction("getConfig?env=local");

    // Then test the callable functions
    console.log("\n==== TESTING CALLABLE FUNCTIONS ====");

    console.log("\n==== TESTING STAKEHOLDER RECOMMENDATION FUNCTION ====");
    await testCallableFunction("generateStakeholderRecommendations", {
      project: "Test Project",
      description: "This is a test project description",
    });

    console.log("\n==== TESTING STAKEHOLDER ADVICE FUNCTION ====");
    await testCallableFunction("generateStakeholderAdvice", {
      stakeholder: {
        name: "John Doe",
        role: "Community Leader",
        influence: 8,
        interest: 7,
      },
    });

    console.log("\n==== TESTING INFLUENCE ANALYSIS FUNCTION ====");
    await testCallableFunction("generateInfluenceAnalysis", {
      stakeholders: [
        { name: "John Doe", role: "Community Leader", influence: 8, interest: 7 },
        { name: "Jane Smith", role: "Government Official", influence: 9, interest: 4 },
      ],
    });

    console.log("\n==== ALL TESTS COMPLETED ====");
  } catch (error) {
    console.error("Error running tests:", error.message);
  }
}

// Function to test an HTTP endpoint
function testHttpFunction(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5001,
      path: `/staketrack-dev/${REGION}/${path}`,
      method: "GET",
    };

    console.log(`Testing HTTP function: ${path}`);
    console.log(`URL: http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);

      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log(`Response for ${path}:`);
        try {
          const jsonData = JSON.parse(responseData);
          console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log("Raw response:", responseData);
        }
        resolve();
      });
    });

    req.on("error", (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

// Start the tests
runTests();
