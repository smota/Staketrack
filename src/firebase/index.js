// Initialize Firebase if not already initialized
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Import the config based on the current environment
import config from '@/config'

// Create a registry of service statuses for monitoring
const serviceStatus = {
  app: { initialized: false, error: null },
  auth: { initialized: false, error: null },
  firestore: { initialized: false, error: null },
  storage: { initialized: false, error: null },
  functions: { initialized: false, error: null },
  analytics: { initialized: false, error: null }
}

// Log the Firebase config (hiding sensitive data)
console.log('Initializing Firebase with config:', {
  projectId: config.firebase.projectId || 'not set',
  authDomain: config.firebase.authDomain || 'not set',
  storageBucket: config.firebase.storageBucket || 'not set',
  region: config.firebase.functionsRegion || 'not set',
  useEmulators: config.useEmulators || false
})

// Initialize Firebase
let app
let auth
let db
let storage
let analytics
let functions

/**
 * Log a critical service initialization error
 * @param {string} service - Name of the service that failed
 * @param {Error} error - The error object
 */
function logServiceError(service, error) {
  console.error(`CRITICAL: Firebase ${service} initialization failed:`, error)
  serviceStatus[service].error = error.message

  // In a production app, you might want to send this to a monitoring service
  if (typeof window !== 'undefined' && config.env.isProduction) {
    // Example: report to a monitoring service if available
    if (window.errorReporting) {
      window.errorReporting.report(`Firebase ${service} initialization failed: ${error.message}`)
    }
  }
}

try {
  // Check if there are existing Firebase apps
  if (getApps().length === 0) {
    console.log('Initializing Firebase app for the first time...')
    try {
      app = initializeApp(config.firebase)
      serviceStatus.app.initialized = true
      console.log('Firebase app initialized successfully with project ID:', config.firebase.projectId)
    } catch (error) {
      logServiceError('app', error)
    }
  } else {
    console.log('Using existing Firebase app...')
    try {
      app = getApp()
      serviceStatus.app.initialized = true
    } catch (error) {
      logServiceError('app', error)
    }
  }

  // Initialize Firebase services
  if (app) {
    // Initialize Auth
    try {
      auth = getAuth(app)
      serviceStatus.auth.initialized = true
      console.log('Firebase Auth initialized successfully')
    } catch (error) {
      logServiceError('auth', error)
    }

    // Initialize Firestore
    try {
      db = getFirestore(app)
      serviceStatus.firestore.initialized = true
      console.log('Firebase Firestore initialized successfully')
    } catch (error) {
      logServiceError('firestore', error)
    }

    // Initialize Storage
    try {
      storage = getStorage(app)
      serviceStatus.storage.initialized = true
      console.log('Firebase Storage initialized successfully')
    } catch (error) {
      logServiceError('storage', error)
    }

    // Initialize Analytics only in browser environment
    if (typeof window !== 'undefined') {
      try {
        isSupported().then(supported => {
          if (supported && config.firebase.measurementId) {
            analytics = getAnalytics(app)
            serviceStatus.analytics.initialized = true
            console.log('Firebase Analytics initialized successfully')
          } else {
            console.log('Firebase Analytics not supported or measurement ID missing')
            analytics = {
              logEvent: () => { },
              setCurrentScreen: () => { },
              setUserId: () => { }
            }
          }
        })
      } catch (error) {
        logServiceError('analytics', error)
        // Provide a dummy implementation
        analytics = {
          logEvent: () => { },
          setCurrentScreen: () => { },
          setUserId: () => { }
        }
      }
    }

    // Connect to emulators if in development mode
    if (config.useEmulators) {
      console.log('Using Firebase emulators...')

      if (auth && serviceStatus.auth.initialized) {
        try {
          connectAuthEmulator(auth, 'http://localhost:9099')
          console.log('Auth emulator connected successfully')
        } catch (error) {
          console.error('Failed to connect to Auth emulator:', error)
        }
      }

      if (db && serviceStatus.firestore.initialized) {
        try {
          connectFirestoreEmulator(db, 'localhost', 8080)
          console.log('Firestore emulator connected successfully')
        } catch (error) {
          console.error('Failed to connect to Firestore emulator:', error)
        }
      }

      if (storage && serviceStatus.storage.initialized) {
        try {
          connectStorageEmulator(storage, 'localhost', 9199)
          console.log('Storage emulator connected successfully')
        } catch (error) {
          console.error('Failed to connect to Storage emulator:', error)
        }
      }
      // Functions emulator connection will be done in the getFunctionsInstance method
    }

    // Enable offline persistence for Firestore (only in production)
    if (db && serviceStatus.firestore.initialized && !config.useEmulators) {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence only enabled in one tab at a time.')
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support all of the features required to enable persistence')
        } else {
          console.error('Error enabling persistence:', err)
        }
      })
    }
  } else {
    console.error('CRITICAL: Firebase app not initialized, services will not be available')
  }
} catch (error) {
  console.error('CRITICAL: Firebase initialization failed:', error)
}

/**
 * Get a Firebase Functions instance for the specified region
 * @param {string} region - The region to use for functions
 * @returns {Object} - The Functions instance, or a mock if not available
 */
function getFunctionsInstance(region = config.firebase.functionsRegion) {
  try {
    if (!config.firebase.projectId) {
      console.error('Cannot initialize Firebase Functions: Project ID is missing')
      return createMockFunctionsInstance('Project ID is missing')
    }

    console.log('Initializing Firebase Functions in region:', region)

    // Try multiple approaches to initialize Firebase Functions
    functions = null

    // Approach 1: Standard initialization with region
    console.log('Attempting to initialize Firebase Functions with standard method')
    try {
      functions = getFunctions(app, region)
      serviceStatus.functions.initialized = true
      console.log('Functions initialization with region successful')

      // Connect to emulator if needed
      if (config.useEmulators) {
        try {
          console.log('Connecting to Functions emulator...')
          connectFunctionsEmulator(functions, 'localhost', 5001)
          console.log('Connected to Functions emulator successfully')
        } catch (emulatorError) {
          console.error('Failed to connect to Functions emulator:', emulatorError)
        }
      }

      // Validate that we got a proper Functions instance
      console.log('Functions instance properties:',
        Object.keys(functions).filter(key => typeof functions[key] !== 'function')
      )

      return functions
    } catch (error) {
      console.error('Standard Functions initialization failed, trying alternative approach:', error)
      serviceStatus.functions.error = `Standard initialization failed: ${error.message}`
    }

    // Approach 2: Try without region
    console.log('Attempting to initialize Functions without region')
    try {
      functions = getFunctions(app)
      serviceStatus.functions.initialized = true
      console.log('Functions initialization without region successful')
      return functions
    } catch (error) {
      console.error('Alternative Functions initialization also failed:', error)
      serviceStatus.functions.error = `${serviceStatus.functions.error || ''}; Without region failed: ${error.message}`
    }

    // Approach 3: Try with direct URL
    try {
      console.log('Attempting to initialize Functions with direct URL')
      const projectId = config.firebase.projectId
      functions = getFunctions(app)
      serviceStatus.functions.initialized = true

      // Workaround attempt to make functions available
      functions._url = `https://${region}-${projectId}.cloudfunctions.net/`
      console.log('Set custom URL for Functions:', functions._url)

      return functions
    } catch (error) {
      console.error('Direct URL Functions initialization also failed:', error)
      serviceStatus.functions.error = `${serviceStatus.functions.error || ''}; Direct URL failed: ${error.message}`
    }

    const errorDetails = `Firebase Functions initialization completely failed. Project ID: ${config.firebase.projectId}, Region: ${region}, Emulators: ${config.useEmulators}`
    console.error('CRITICAL:', errorDetails)

    // In production, report to monitoring service
    if (typeof window !== 'undefined' && config.env.isProduction && window.errorReporting) {
      window.errorReporting.report(errorDetails)
    }

    return createMockFunctionsInstance(serviceStatus.functions.error || 'Multiple initialization approaches failed')
  } catch (error) {
    console.error('Error getting Firebase Functions instance:', error)
    return createMockFunctionsInstance(`Caught exception: ${error.message}`)
  }
}

/**
 * Create a mock Functions instance for graceful degradation
 * @param {string} reason - Reason for creating mock
 * @returns {Object} - A mock Functions instance
 */
function createMockFunctionsInstance(reason = 'unknown reason') {
  console.warn(`Using mock Functions instance (${reason}). Some features may be limited.`)

  return {
    _isMock: true,
    _mockReason: reason,
    httpsCallable: (name) => {
      return async (data) => {
        console.warn(`Mock function call to ${name}:`, data)
        return {
          data: {
            success: false,
            error: 'Firebase Functions not available',
            reason: reason,
            _isMock: true
          }
        }
      }
    }
  }
}

/**
 * Get the status of all Firebase services
 * @returns {Object} Status of all services
 */
function getServicesStatus() {
  return { ...serviceStatus }
}

// Export Firebase services
export {
  app,
  auth,
  db,
  storage,
  analytics,
  getFunctionsInstance,
  getServicesStatus
}

export default app
