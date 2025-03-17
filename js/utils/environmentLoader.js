/**
 * Environment variables loader
 * Loads environment variables from .env files or process.env
 */

// In a browser environment, you might need to load from a .env file
// or have your build process inject these values
const loadEnvironment = () => {
  // Check if running in Node.js environment (for build tools)
  if (typeof process !== 'undefined' && process.env) {
    return {
      ENVIRONMENT: process.env.ENVIRONMENT || 'DEV',
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_API_ENDPOINT: process.env.ANTHROPIC_API_ENDPOINT
    };
  }
  
  // For browser environments, you'll need to inject these values during build
  // For development, you might want to provide defaults here
  return {
    ENVIRONMENT: window.ENV || 'DEV',
    FIREBASE_API_KEY: window.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: window.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: window.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: window.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: window.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: window.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: window.FIREBASE_MEASUREMENT_ID,
    ANTHROPIC_API_KEY: window.ANTHROPIC_API_KEY,
    ANTHROPIC_API_ENDPOINT: window.ANTHROPIC_API_ENDPOINT
  };
};

export const env = loadEnvironment(); 