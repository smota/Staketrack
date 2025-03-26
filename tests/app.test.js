import { jest } from '@jest/globals'
import StakeTrackApp from '../js/app.js'
import appController from '../js/controllers/appController.js'
import authController from '../js/controllers/authController.js'
import mapController from '../js/controllers/mapController.js'
import stakeholderController from '../js/controllers/stakeholderController.js'
import tooltipService from '../js/services/tooltipService.js'
import { analytics } from '../firebase/firebaseConfig.js'

// Mock all dependencies
jest.mock('../js/controllers/appController.js')
jest.mock('../js/controllers/authController.js')
jest.mock('../js/controllers/mapController.js')
jest.mock('../js/controllers/stakeholderController.js')
jest.mock('../js/services/tooltipService.js')
jest.mock('../firebase/firebaseConfig.js', () => ({
  analytics: {
    logEvent: jest.fn()
  }
}))

describe('StakeTrackApp', () => {
  let app

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()

    // Create a new instance of the app for each test
    app = new StakeTrackApp()

    // Mock console methods
    global.console.log = jest.fn()
    global.console.error = jest.fn()
    global.alert = jest.fn()
  })

  describe('constructor', () => {
    test('should initialize controllers object correctly', () => {
      expect(app.controllers).toEqual({
        app: appController,
        auth: authController,
        map: mapController,
        stakeholder: stakeholderController
      })
    })
  })

  describe('init', () => {
    test('should initialize all services and controllers', async () => {
      // Setup successful initialization
      tooltipService.init.mockReturnValue(undefined)
      appController.init.mockResolvedValue(undefined)
      authController.init.mockReturnValue(undefined)
      mapController.init.mockReturnValue(undefined)
      stakeholderController.init.mockReturnValue(undefined)

      await app.init()

      // Verify tooltipService was initialized
      expect(tooltipService.init).toHaveBeenCalledTimes(1)

      // Verify all controllers were initialized
      expect(appController.init).toHaveBeenCalledTimes(1)
      expect(authController.init).toHaveBeenCalledTimes(1)
      expect(mapController.init).toHaveBeenCalledTimes(1)
      expect(stakeholderController.init).toHaveBeenCalledTimes(1)

      // Verify analytics was called
      expect(analytics.logEvent).toHaveBeenCalledWith('application_started')

      // Verify console log was called
      expect(console.log).toHaveBeenCalledWith('StakeTrack application initialized.')
    })

    test('should handle initialization errors properly', async () => {
      // Setup error scenario
      const testError = new Error('Test initialization error')
      tooltipService.init.mockImplementation(() => {
        throw testError
      })

      await app.init()

      // Verify error was logged to console
      expect(console.error).toHaveBeenCalledWith('Error initializing application:', testError)

      // Verify error was logged to analytics
      expect(analytics.logEvent).toHaveBeenCalledWith('init_error', {
        error_message: testError.message,
        error_stack: testError.stack
      })

      // Verify alert was shown to user
      expect(alert).toHaveBeenCalledWith(
        `An error occurred initializing the application: ${testError.message}\n\nPlease refresh the page to try again.`
      )
    })
  })

  describe('DOM event listener', () => {
    test('should initialize app when DOM is loaded', () => {
      // Store original addEventListener
      const originalAddEventListener = document.addEventListener

      // Mock document.addEventListener
      document.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          callback()
        }
      })

      // Re-import the module to trigger the event listener
      jest.isolateModules(() => {
        require('../js/app.js')
      })

      // Verify addEventListener was called with correct event
      expect(document.addEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      )

      // Restore original addEventListener
      document.addEventListener = originalAddEventListener
    })
  })
})
