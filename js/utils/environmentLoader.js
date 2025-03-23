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
 * Fetches the Firebase configuration securely from the server
 * This prevents exposing API keys and other sensitive information in client-side code
 */
async function fetchFirebaseConfig() {
  try {
    // Get the current hostname to determine environment
    const hostname = window.location.hostname;
    let configEndpoint = '/config/dev.json';

    // For local development using emulators
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      configEndpoint = '/config/dev.json';
    } else if (hostname.includes('staketrack.com')) {
      // For production environment
      configEndpoint = '/api/config';
    } else if (hostname.includes('staging-staketrack.web.app')) {
      // For staging environment
      configEndpoint = '/api/config?env=staging';
    }

    const response = await fetch(configEndpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch configuration: ${response.status}`);
    }

    const config = await response.json();

    // Update both window.ENV and our exported env object
    Object.assign(window.ENV, config);
    Object.assign(envData, config);

    console.log(`Environment loaded: ${config.ENVIRONMENT || 'Unknown'}`);
  } catch (error) {
    console.error('Error loading environment configuration:', error);

    // Set default values for development as fallback
    const defaults = {
      ENVIRONMENT: 'DEV',
      FIREBASE_USE_EMULATOR: true
    };

    // Update both window.ENV and our exported env object
    Object.assign(window.ENV, defaults);
    Object.assign(envData, defaults);

    // Show error UI if available
    const alertEl = document.getElementById('firebase-error-alert');
    if (alertEl) {
      alertEl.classList.remove('hidden');

      // Add close button event listener
      const closeBtn = document.getElementById('firebase-error-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          alertEl.classList.add('hidden');
        });
      }
    }
  }
}

// Execute the configuration loading
fetchFirebaseConfig(); 