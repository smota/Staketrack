import appController from './controllers/appController.js';
import authController from './controllers/authController.js';
import mapController from './controllers/mapController.js';
import stakeholderController from './controllers/stakeholderController.js';
import tooltipService from './services/tooltipService.js';
import telemetryService from './services/telemetryService.js';
import { configService } from './services/configService.js';
import { analyticsService } from './services/analyticsService.js';
import { stakeholderService } from './services/stakeholderService.js';
import versionDisplay from './components/versionDisplay.js';
import matrixView from './components/matrixView.js';
import stakeholderList from './components/stakeholderList.js';
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
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;

    try {
      console.log(`Initializing StakeTrack application in ${env.ENVIRONMENT} environment...`);

      // Initialize configuration first
      await configService.initialize();

      // Initialize analytics with fallback
      await analyticsService.initialize();

      // Initialize stakeholder service
      await stakeholderService.initialize();

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

      // Log application started event
      analyticsService.logEvent('application_started', {
        environment: env.ENVIRONMENT,
        initialization_time: endTime - startTime
      });

      telemetryService.info('Application initialized successfully', {
        'initialization_time_ms': endTime - startTime,
        'environment': env.ENVIRONMENT
      });

      this.initialized = true;
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
    analyticsService.logEvent('init_error', {
      error_message: error.message,
      error_stack: error.stack,
      environment: env.ENVIRONMENT
    });

    telemetryService.recordMetric('user_actions', 1, {
      action: 'app_initialization_error',
      environment: env.ENVIRONMENT
    });

    // Show error message to user
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = `An error occurred initializing the application: ${error.message}`;
      errorMessage.classList.remove('hidden');
    } else {
      alert(`An error occurred initializing the application: ${error.message}\n\nPlease refresh the page to try again.`);
    }
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

  // Start application
  const startApp = async () => {
    try {
      telemetryService.createSpan('app.startup', async () => {
        const app = new StakeTrackApp();
        await app.init();
      });
    } catch (error) {
      console.error('Failed to start application:', error);
      // Show error message
      const errorMessage = document.getElementById('error-message');
      if (errorMessage) {
        errorMessage.textContent = 'Failed to start application. Please refresh the page.';
        errorMessage.classList.remove('hidden');
      }
    }
  };

  // Start app immediately - no need to wait for Firebase
  startApp();
});
