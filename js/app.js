import appController from './controllers/appController.js';
import authController from './controllers/authController.js';
import mapController from './controllers/mapController.js';
import stakeholderController from './controllers/stakeholderController.js';
import tooltipService from './services/tooltipService.js';
import telemetryService from './services/telemetryService.js';
import { analytics } from '../../firebase/firebaseConfig.js';
import { config } from './config.js';
import { env } from './utils/environmentLoader.js';

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
        analytics.logEvent('application_started', {
          environment: env.ENVIRONMENT
        });
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
    if (analytics && config.features.analytics) {
      analytics.logEvent('init_error', { 
        error_message: error.message,
        error_stack: error.stack,
        environment: env.ENVIRONMENT
      });
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
  
  // Create span for app initialization
  telemetryService.createSpan('app.startup', async () => {
    const app = new StakeTrackApp();
    await app.init();
  });
});
