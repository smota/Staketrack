/**
 * Environment variables loader
 * Securely loads environment variables for Firebase configuration
 */

// Create an environment object to export
const envData = {};
export const env = envData;

// Initialize window.ENV
window.ENV = window.ENV || {};

/**
 * Fetches the Firebase configuration
 * - Uses static config files for LOCAL environment with emulators
 * - Uses environment variables via API for DEV and PRD environments
 */
async function fetchFirebaseConfig() {
  try {
    // Get the current hostname to determine environment
    const hostname = window.location.hostname;
    let configSource;
    let envName;
    let useStaticFile = false;

    // Determine environment based on hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local development with emulators - use static file
      configSource = '/config/local.json';
      envName = 'local';
      useStaticFile = true;
    } else if (hostname.includes('staketrack-dev.web.app') || hostname.includes('staketrack-dev.firebaseapp.com')) {
      // Development environment - use API endpoint
      configSource = '/api/get-config?env=development';
      envName = 'development';
    } else if (hostname.includes('staketrack.com') || hostname.includes('staketrack.web.app')) {
      // Production environment - use API endpoint
      configSource = '/api/get-config?env=production';
      envName = 'production';
    } else {
      // Default - assume development
      configSource = '/api/get-config?env=development';
      envName = 'development';
    }

    console.log(`Loading configuration for ${envName} environment from ${configSource}`);

    // Try to fetch the configuration
    try {
      const response = await fetch(configSource);

      if (!response.ok) {
        throw new Error(`Failed to fetch configuration: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got: ${contentType}`);
      }

      const config = await response.json();

      // Update both window.ENV and our exported env object
      Object.assign(window.ENV, config);
      Object.assign(envData, config);

      console.log(`Environment loaded: ${config.ENVIRONMENT || envName}`);

      // Dispatch event to signal environment has been loaded
      window.dispatchEvent(new CustomEvent('env:loaded', { detail: config }));

    } catch (error) {
      console.error(`Error loading configuration from ${useStaticFile ? 'file' : 'API'}:`, error);

      // If this is local environment and static file failed, show critical error
      if (useStaticFile) {
        console.error('Local configuration file could not be loaded. Please ensure /config/local.json exists and is properly formatted.');
      }

      // For all environments, create minimal configuration without sensitive data
      const defaultEmptyConfig = {
        ENVIRONMENT: useStaticFile ? 'LOCAL' : (hostname.includes('staketrack-dev') ? 'DEV' : 'PRD'),
        USE_EMULATORS: useStaticFile ? 'true' : 'false',
        CONFIG_INCOMPLETE: true
      };

      // Update both window.ENV and our exported env object
      Object.assign(window.ENV, defaultEmptyConfig);
      Object.assign(envData, defaultEmptyConfig);

      // Flag to indicate that configuration is incomplete
      window.ENV.CONFIG_INCOMPLETE = true;

      console.warn('Using incomplete configuration. Firebase services will be unavailable.');

      // Dispatch both events: error and loaded with incomplete config
      window.dispatchEvent(new CustomEvent('env:error', { detail: error }));
      window.dispatchEvent(new CustomEvent('env:loaded', { detail: defaultEmptyConfig }));
    }
  } catch (error) {
    console.error('Fatal error in environment loading process:', error);

    // Create minimal default configuration without sensitive data
    const defaultEmptyConfig = {
      ENVIRONMENT: 'UNKNOWN',
      USE_EMULATORS: 'false',
      CONFIG_INCOMPLETE: true
    };

    // Update both window.ENV and our exported env object
    Object.assign(window.ENV, defaultEmptyConfig);
    Object.assign(envData, defaultEmptyConfig);

    // Dispatch error event
    window.dispatchEvent(new CustomEvent('env:error', { detail: error }));

    // Then dispatch loaded event with default empty config to ensure application continues
    window.dispatchEvent(new CustomEvent('env:loaded', { detail: defaultEmptyConfig }));
  }
}

// Execute the configuration loading immediately
fetchFirebaseConfig(); 