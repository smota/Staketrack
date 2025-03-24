/**
 * Environment configuration loader
 * Loads environment configuration from the server based on the current hostname
 */

// Constants for environment types
const ENVIRONMENTS = {
  LOCAL: 'LOCAL',
  DEV: 'DEV',
  PRD: 'PRD'
};

// Default configuration for local development
const DEFAULT_CONFIG = {
  ENVIRONMENT: ENVIRONMENTS.LOCAL,
  CONFIG_INCOMPLETE: true,
  USE_EMULATORS: 'true',
  API_BASE_URL: 'http://localhost:5000',
  FIREBASE_API_KEY: '',
  FIREBASE_AUTH_DOMAIN: '',
  FIREBASE_PROJECT_ID: '',
  FIREBASE_STORAGE_BUCKET: '',
  FIREBASE_MESSAGING_SENDER_ID: '',
  FIREBASE_APP_ID: '',
  FIREBASE_MEASUREMENT_ID: ''
};

/**
 * Determines the environment based on the current hostname
 * @returns {string} The environment type (LOCAL, DEV, or PRD)
 */
function determineEnvironment() {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return ENVIRONMENTS.LOCAL;
  } else if (hostname.includes('dev') || hostname.includes('staging')) {
    return ENVIRONMENTS.DEV;
  } else {
    return ENVIRONMENTS.PRD;
  }
}

/**
 * Fetches environment configuration from the server
 * @param {string} environment The environment type
 * @returns {Promise<Object>} The environment configuration
 */
async function fetchEnvironmentConfig(environment) {
  try {
    const response = await fetch(`/config/${environment.toLowerCase()}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch environment config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching environment config:', error);
    return { ...DEFAULT_CONFIG, error: error.message };
  }
}

/**
 * Validates the environment configuration
 * @param {Object} config The environment configuration to validate
 * @returns {boolean} Whether the configuration is valid
 */
function validateConfig(config) {
  const requiredFields = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID'
  ];

  return requiredFields.every(field => {
    const hasField = config[field] && config[field].length > 0;
    if (!hasField) {
      console.warn(`Missing required configuration field: ${field}`);
    }
    return hasField;
  });
}

/**
 * Loads the environment configuration
 * @returns {Promise<void>}
 */
async function loadEnvironmentConfig() {
  try {
    const environment = determineEnvironment();
    const config = await fetchEnvironmentConfig(environment);

    // Validate the configuration
    const isValid = validateConfig(config);

    // Set the configuration in the window object
    window.ENV = {
      ...config,
      ENVIRONMENT: environment,
      CONFIG_INCOMPLETE: !isValid
    };

    // Dispatch event to signal environment is loaded
    window.dispatchEvent(new CustomEvent('env:loaded', {
      detail: window.ENV
    }));

  } catch (error) {
    console.error('Error loading environment config:', error);

    // Set default configuration
    window.ENV = {
      ...DEFAULT_CONFIG,
      error: error.message
    };

    // Dispatch event to signal environment loading error
    window.dispatchEvent(new CustomEvent('env:error', {
      detail: { error }
    }));
  }
}

// Load environment configuration when the script is loaded
loadEnvironmentConfig();

// Export functions for testing
export {
  determineEnvironment,
  fetchEnvironmentConfig,
  validateConfig,
  loadEnvironmentConfig,
  ENVIRONMENTS,
  DEFAULT_CONFIG
}; 