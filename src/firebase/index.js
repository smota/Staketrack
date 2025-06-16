// Initialize Firebase if not already initialized
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
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
  projectId: config.env.firebaseConfig.projectId || 'not set',
  authDomain: config.env.firebaseConfig.authDomain || 'not set',
  storageBucket: config.env.firebaseConfig.storageBucket || 'not set',
  region: config.env.firebase.functionsRegion || 'not set',
  useEmulators: config.features.useEmulators || false
})

// Initialize Firebase
let app
let auth
let db
let storage = null // Set to null initially for lazy loading
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
      app = initializeApp(config.env.firebaseConfig)
      serviceStatus.app.initialized = true
      console.log('Firebase app initialized successfully with project ID:', config.env.firebaseConfig.projectId)
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

    // Storage is now lazy loaded - see getFirebaseStorage function

    // Initialize Analytics only in browser environment
    if (typeof window !== 'undefined') {
      try {
        isSupported().then(supported => {
          if (supported && config.env.firebaseConfig.measurementId) {
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
    if (config.features.useEmulators) {
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
    if (db && serviceStatus.firestore.initialized && !config.features.useEmulators) {
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
function getFunctionsInstance(region = config.env.firebase.functionsRegion) {
  try {
    // Basic validation
    if (!app) {
      const reason = 'Firebase app not initialized'
      console.warn(`Cannot initialize Firebase Functions: ${reason}`)
      serviceStatus.functions.error = reason
      return createMockFunctionsInstance(reason)
    }

    if (!config.env.firebaseConfig.projectId) {
      const reason = 'Project ID is missing'
      console.warn(`Cannot initialize Firebase Functions: ${reason}`)
      serviceStatus.functions.error = reason
      return createMockFunctionsInstance(reason)
    }

    console.log('Initializing Firebase Functions in region:', region)

    // Single, simplified approach to improve reliability
    try {
      // Use region if specified, otherwise default
      const functionsRegion = region || 'us-central1'
      console.log(`Attempting to initialize Firebase Functions in ${functionsRegion}`)

      functions = getFunctions(app, functionsRegion)

      // Connect to emulator if needed - continue even if this fails
      if (config.features.useEmulators) {
        try {
          console.log('Connecting to Functions emulator...')
          connectFunctionsEmulator(functions, 'localhost', 5001)
          console.log('Connected to Functions emulator successfully')
        } catch (emulatorError) {
          // Non-critical error - log but continue with the functions instance
          console.warn('Non-critical: Failed to connect to Functions emulator:', emulatorError)
          console.warn('Functions will still be available but may use production services')
        }
      }

      // Mark as successfully initialized
      serviceStatus.functions.initialized = true
      serviceStatus.functions.error = null
      console.log('Firebase Functions initialized successfully')

      return functions
    } catch (error) {
      // Capture specific error details
      const errorMessage = error.message || String(error)
      console.error('Firebase Functions initialization failed:', error)

      // Record the error for monitoring
      serviceStatus.functions.error = errorMessage

      // Alert developers in production for monitoring
      if (typeof window !== 'undefined' && config.env.isProduction && window.errorReporting) {
        window.errorReporting.report(`Firebase Functions initialization failed: ${errorMessage}`)
      }

      // Return mock functions instance for graceful degradation
      return createMockFunctionsInstance(errorMessage)
    }
  } catch (outerError) {
    // Catch any unexpected errors in our initialization logic
    const errorMessage = outerError.message || String(outerError)
    console.error('Unexpected error initializing Firebase Functions:', outerError)
    serviceStatus.functions.error = errorMessage
    return createMockFunctionsInstance(`Unexpected error: ${errorMessage}`)
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
 * Create a mock Storage instance for graceful degradation
 * @param {string} reason - Reason for creating mock
 * @returns {Object} - A mock Storage instance
 */
function createMockStorageInstance(reason = 'unknown reason') {
  console.warn(`Using mock Storage instance (${reason}). Some features may be limited.`)

  // Create a minimal mock that won't break code expecting Storage API
  return {
    _isMock: true,
    _mockReason: reason,
    ref: (path) => ({
      put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('') } }),
      getDownloadURL: () => Promise.resolve(''),
      delete: () => Promise.resolve(),
      listAll: () => Promise.resolve({ items: [], prefixes: [] }),
      _path: path
    })
  }
}

/**
 * Lazily initialize Firebase Storage and return the instance
 * Only initializes storage when actually needed and if user is authenticated
 * @returns {Object} Firebase Storage instance or mock if initialization fails
 */
function getFirebaseStorage() {
  // Return existing instance if already initialized
  if (storage && serviceStatus.storage.initialized) {
    return storage
  }

  try {
    console.log('Lazy loading Firebase Storage...')
    if (!app) {
      const reason = 'Firebase app not initialized'
      console.warn(`Cannot initialize Storage: ${reason}`)
      serviceStatus.storage.error = reason
      return createMockStorageInstance(reason)
    }

    // Initialize Storage
    storage = getStorage(app)
    serviceStatus.storage.initialized = true
    console.log('Firebase Storage initialized successfully')

    // Connect to emulator if needed
    if (config.features.useEmulators) {
      try {
        connectStorageEmulator(storage, 'localhost', 9199)
        console.log('Storage emulator connected successfully')
      } catch (emulatorError) {
        // Non-critical error - log but continue with the storage instance
        console.warn('Non-critical: Failed to connect to Storage emulator:', emulatorError)
        // We don't consider this a failure of the overall storage initialization
      }
    }

    return storage
  } catch (error) {
    const errorMessage = error.message || String(error)
    console.error('Error initializing Storage:', error)
    serviceStatus.storage.error = errorMessage

    // Return mock storage to prevent null reference errors
    return createMockStorageInstance(errorMessage)
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
  getServicesStatus,
  getFirebaseStorage
}

export default app
