import StakeTrackApp from '../js/app.js';
import tooltipService from '../js/services/tooltipService.js';
import { analytics } from '../../firebase/firebaseConfig.js';

// Mock controllers
jest.mock('../js/controllers/appController.js', () => ({
  init: jest.fn().mockResolvedValue()
}));
jest.mock('../js/controllers/authController.js', () => ({
  init: jest.fn()
}));
jest.mock('../js/controllers/mapController.js', () => ({
  init: jest.fn()
}));
jest.mock('../js/controllers/stakeholderController.js', () => ({
  init: jest.fn()
}));
jest.mock('../js/services/tooltipService.js', () => ({
  init: jest.fn()
}));

describe('StakeTrack Application Integration', () => {
  let app;

  beforeEach(() => {
    app = new StakeTrackApp();
  });

  test('should initialize all controllers and services', async () => {
    await app.init();

    // Check if all services and controllers were initialized
    expect(tooltipService.init).toHaveBeenCalled();
    expect(app.controllers.app.init).toHaveBeenCalled();
    expect(app.controllers.auth.init).toHaveBeenCalled();
    expect(app.controllers.map.init).toHaveBeenCalled();
    expect(app.controllers.stakeholder.init).toHaveBeenCalled();
    expect(analytics.logEvent).toHaveBeenCalledWith('application_started');
  });

  test('should handle initialization errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    
    // Force app controller to throw an error
    app.controllers.app.init.mockRejectedValue(new Error('Test error'));
    
    await app.init();
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
    expect(analytics.logEvent).toHaveBeenCalledWith('init_error', expect.any(Object));
    
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });
}); 