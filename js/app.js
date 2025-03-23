import appController from './controllers/appController.js';
import authController from './controllers/authController.js';
import mapController from './controllers/mapController.js';
import stakeholderController from './controllers/stakeholderController.js';
import tooltipService from './services/tooltipService.js';
import telemetryService from './services/telemetryService.js';
import versionDisplay from './components/versionDisplay.js';
// Import component singletons to ensure they're initialized
import matrixView from './components/matrixView.js';
import stakeholderList from './components/stakeholderList.js';
// Import from global variables instead
// import { analytics } from '../firebase/firebaseConfig.js';
import { config } from './config.js';
import { env } from '../config/environmentLoader.js';

/**
 * Main application entry point
 */
class StakeTrackApp {
  constructor() {
    this.controllers = {
      app: appController,
      auth: authController,
      map: mapController,
      stakeholder: stakeholderController
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log(`Initializing StakeTrack application in ${env.ENVIRONMENT} environment...`);

      // Access analytics from window
      const analytics = window.firebaseAnalytics;

      // Initialize OpenTelemetry
      telemetryService.init();
      telemetryService.info('Application initialization started', {
        environment: env.ENVIRONMENT
      });

      // Record application load time
      const startTime = performance.now();

      // Initialize controllers within a span
      await telemetryService.createSpan('app.init', async () => {
        // Initialize tooltip service
        tooltipService.init();

        // Initialize version display
        versionDisplay.init();

        // Initialize controllers
        await this.controllers.app.init();
        this.controllers.auth.init();
        this.controllers.map.init();
        this.controllers.stakeholder.init();
      }, { 'app.version': config.version });

      // Record app initialization time
      const endTime = performance.now();
      telemetryService.recordMetric('operation_duration', endTime - startTime, {
        operation: 'app_initialization'
      });

      // Log application started event (only in production or if analytics enabled)
      if (analytics && config.features.analytics) {
        try {
          analytics.logEvent('application_started', {
            environment: env.ENVIRONMENT
          });
        } catch (e) {
          console.warn('Failed to log analytics event:', e);
        }
      }

      telemetryService.info('Application initialized successfully', {
        'initialization_time_ms': endTime - startTime,
        'environment': env.ENVIRONMENT
      });

      console.log('StakeTrack application initialized.');
    } catch (error) {
      console.error('Error initializing application:', error);
      telemetryService.error('Failed to initialize application', error);
      this._handleInitError(error);
    }
  }

  /**
   * Handle initialization error
   * @param {Error} error - Error object
   * @private
   */
  _handleInitError(error) {
    // Log error
    const analytics = window.firebaseAnalytics;
    if (analytics && config.features.analytics) {
      try {
        analytics.logEvent('init_error', {
          error_message: error.message,
          error_stack: error.stack,
          environment: env.ENVIRONMENT
        });
      } catch (e) {
        console.warn('Failed to log error analytics:', e);
      }
    }

    telemetryService.recordMetric('user_actions', 1, {
      action: 'app_initialization_error',
      environment: env.ENVIRONMENT
    });

    // Show error message to user
    alert(`An error occurred initializing the application: ${error.message}\n\nPlease refresh the page to try again.`);
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Record page load time
  const pageLoadTime = performance.now();
  telemetryService.recordMetric('page_load_time', pageLoadTime, {
    page: 'index',
    environment: env.ENVIRONMENT
  });

  // Check if Firebase is initialized, or wait for its initialization
  const startApp = async () => {
    telemetryService.createSpan('app.startup', async () => {
      const app = new StakeTrackApp();
      await app.init();
    });
  };

  // Add listener for Firebase initialization
  if (window.firebaseApp || window.firebaseConfig?.isConfigured) {
    // Firebase is already initialized, start app
    startApp();
  } else {
    // Wait for Firebase to be initialized or report an error
    const firebaseInitializedListener = () => {
      window.removeEventListener('firebase:initialized', firebaseInitializedListener);
      startApp();
    };

    const firebaseErrorListener = (event) => {
      window.removeEventListener('firebase:error', firebaseErrorListener);
      console.warn('Starting app with limited functionality due to Firebase error:', event.detail);
      startApp();
    };

    window.addEventListener('firebase:initialized', firebaseInitializedListener);
    window.addEventListener('firebase:error', firebaseErrorListener);

    // Fallback if no event is fired within 5 seconds
    setTimeout(() => {
      window.removeEventListener('firebase:initialized', firebaseInitializedListener);
      window.removeEventListener('firebase:error', firebaseErrorListener);
      console.warn('No Firebase initialization event received after timeout. Starting app with limited functionality.');
      startApp();
    }, 5000);
  }
});
