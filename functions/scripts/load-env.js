/**
 * Load Environment Variables Script
 *
 * This script loads environment variables from the central .env files based on the deployment target.
 * It creates a consolidated environment file for functions deployment.
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Root directory (one level up from functions/scripts)
const rootDir = path.resolve(__dirname, "..", "..");

// Get the environment from arguments or Firebase project ID
const getEnvironment = () => {
  // First check if we have an explicit environment argument
  const args = process.argv.slice(2);
  if (args.length > 0) {
    return args[0];
  }

  // Try to determine from Firebase project ID in .firebaserc
  try {
    const firebaseRcPath = path.join(rootDir, ".firebaserc");
    if (fs.existsSync(firebaseRcPath)) {
      const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, "utf8"));
      const projectId = firebaseRc.projects.default;
      if (projectId.includes("prod")) {
        return "production";
      } else if (projectId.includes("dev")) {
        return "staging";
      }
    }
  } catch (err) {
    console.warn("Could not determine environment from .firebaserc:", err.message);
  }

  // Default to development
  return "development";
};

const environment = getEnvironment();
console.log(`Loading environment variables for: ${environment}`);

// Paths to environment files
const envFilePath = path.join(rootDir, `.env.${environment}`);
const localEnvFilePath = path.join(rootDir, `.env.${environment}.local`);
const functionsEnvPath = path.join(__dirname, "..", ".env.functions");

// Load environment variables
const loadEnvVars = () => {
  const envVars = {};

  // Load main environment file
  if (fs.existsSync(envFilePath)) {
    console.log(`Loading environment variables from ${envFilePath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
    Object.assign(envVars, envConfig);
  } else {
    console.warn(`Environment file ${envFilePath} not found`);
  }

  // Load local environment file with sensitive vars if it exists
  if (fs.existsSync(localEnvFilePath)) {
    console.log(`Loading local environment variables from ${localEnvFilePath}`);
    const localEnvConfig = dotenv.parse(fs.readFileSync(localEnvFilePath));
    Object.assign(envVars, localEnvConfig);
  } else {
    console.warn(`Local environment file ${localEnvFilePath} not found`);
  }

  // Add Firebase function specific variables
  envVars.REGION = envVars.APP_FIREBASE_FUNCTIONS_REGION || "europe-west1";
  envVars.FUNCTION_MEMORY = envVars.FUNCTION_MEMORY || "256MiB";
  envVars.FUNCTION_MAX_INSTANCES = envVars.FUNCTION_MAX_INSTANCES || "10";

  return envVars;
};

// Save environment variables to a file for Firebase Functions
const saveEnvFile = (envVars) => {
  const content = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  fs.writeFileSync(functionsEnvPath, content);
  console.log(`Environment variables saved to ${functionsEnvPath}`);
};

// Execute
const envVars = loadEnvVars();
saveEnvFile(envVars);

// Also set these variables for the current process
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

console.log("Environment variables loaded successfully");
