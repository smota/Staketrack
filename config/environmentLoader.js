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
 * Always uses environment variables via API for all environments
 */
async function fetchFirebaseConfig() {
  try {
    // Get the current hostname to determine environment
    const hostname = window.location.hostname;
    let configSource;
    let envName;

    // Determine environment based on hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      configSource = '/api/get-config?env=local';
      envName = 'local';
    } else if (hostname.includes('staketrack-dev.web.app') || hostname.includes('staketrack-dev.firebaseapp.com')) {
      configSource = '/api/get-config?env=development';
      envName = 'development';
    } else if (hostname.includes('staketrack.com') || hostname.includes('staketrack.web.app')) {
      configSource = '/api/get-config?env=production';
      envName = 'production';
    } else {
      configSource = '/api/get-config?env=development';
      envName = 'development';
    }

    console.log(`Loading configuration for ${envName} environment from ${configSource}`);

    // Try to fetch configuration from API
    const response = await fetch(configSource);
    if (!response.ok) {
      throw new Error(`Failed to load configuration: ${response.statusText}`);
    }

    const config = await response.json();

    // Validate configuration before applying
    if (!config || !config.firebase || !config.firebase.apiKey || !config.firebase.authDomain || !config.firebase.projectId) {
      throw new Error('Incomplete configuration received');
    }

    // Update window.ENV with the received configuration
    window.ENV = {
      ...window.ENV,
      ENVIRONMENT: envName.toUpperCase(),
      FIREBASE_API_KEY: config.firebase.apiKey,
      FIREBASE_AUTH_DOMAIN: config.firebase.authDomain,
      FIREBASE_PROJECT_ID: config.firebase.projectId,
      FIREBASE_STORAGE_BUCKET: config.firebase.storageBucket,
      FIREBASE_MESSAGING_SENDER_ID: config.firebase.messagingSenderId,
      FIREBASE_APP_ID: config.firebase.appId,
      FIREBASE_MEASUREMENT_ID: config.firebase.measurementId,
      USE_EMULATORS: envName === 'local' ? 'true' : 'false',
      CONFIG_INCOMPLETE: false
    };

    // Dispatch environment loaded event
    window.dispatchEvent(new CustomEvent('env:loaded', { detail: window.ENV }));
    console.log(`Environment loaded: ${window.ENV.ENVIRONMENT}`);

    return window.ENV;

  } catch (error) {
    console.error('Error loading configuration:', error);
    return loadFallbackConfig();
  }
}

function loadFallbackConfig() {
  const hostname = window.location.hostname;
  const envName = hostname.includes('localhost') ? 'LOCAL' : 'DEVELOPMENT';

  // Set minimal configuration for fallback
  window.ENV = {
    ENVIRONMENT: envName,
    USE_EMULATORS: envName === 'LOCAL' ? 'true' : 'false',
    CONFIG_INCOMPLETE: true
  };

  // Dispatch error event
  window.dispatchEvent(new CustomEvent('env:error', {
    detail: { error: new Error('Failed to load configuration, using fallback') }
  }));

  console.log(`Environment loaded from fallback: ${envName.toLowerCase()}`);
  return window.ENV;
}

// Execute the configuration loading immediately and initialize Firebase afterward
fetchFirebaseConfig().then(() => {
  // Initialize Firebase only after environment is loaded
  if (typeof initializeFirebase === 'function') {
    initializeFirebase();
  }
}).catch(error => {
  console.error('Failed to initialize application:', error);
}); 