// Initialize Firebase if not already initialized
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Import the config based on the current environment
import config from '@/config'

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

try {
  // Check if there are existing Firebase apps
  if (getApps().length === 0) {
    console.log('Initializing Firebase app for the first time...')
    app = initializeApp(config.firebase)
    console.log('Firebase app initialized successfully with project ID:', config.firebase.projectId)
  } else {
    console.log('Using existing Firebase app...')
    app = getApp()
  }

  // Initialize Firebase services
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  // Initialize Analytics only in browser environment
  if (typeof window !== 'undefined') {
    try {
      isSupported().then(supported => {
        if (supported && config.firebase.measurementId) {
          analytics = getAnalytics(app)
        } else {
          analytics = {
            logEvent: () => { },
            setCurrentScreen: () => { },
            setUserId: () => { }
          }
        }
      })
    } catch (error) {
      console.warn('Analytics initialization failed:', error)
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
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
    // Functions emulator connection will be done in the getFunctionsInstance method
  }

  // Enable offline persistence for Firestore (only in production)
  if (!config.useEmulators) {
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
} catch (error) {
  console.error('Error initializing Firebase:', error)
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
      return createMockFunctionsInstance()
    }

    console.log('Initializing Firebase Functions in region:', region)

    // Try multiple approaches to initialize Firebase Functions

    // Approach 1: Standard initialization with region
    console.log('Attempting to initialize Firebase Functions with standard method')
    try {
      const functionsInstance = getFunctions(app, region)
      console.log('Functions initialization with region successful')

      // Connect to emulator if needed
      if (config.useEmulators) {
        try {
          console.log('Connecting to Functions emulator...')
          connectFunctionsEmulator(functionsInstance, 'localhost', 5001)
          console.log('Connected to Functions emulator successfully')
        } catch (emulatorError) {
          console.error('Failed to connect to Functions emulator:', emulatorError)
        }
      }

      // Validate that we got a proper Functions instance
      console.log('Functions instance properties:',
        Object.keys(functionsInstance).filter(key => typeof functionsInstance[key] !== 'function')
      )

      return functionsInstance
    } catch (error) {
      console.error('Standard Functions initialization failed, trying alternative approach:', error)
    }

    // Approach 2: Try without region
    console.log('Attempting to initialize Functions without region')
    try {
      const functionsInstance = getFunctions(app)
      console.log('Functions initialization without region successful')
      return functionsInstance
    } catch (error) {
      console.error('Alternative Functions initialization also failed:', error)
    }

    // Approach 3: Try with direct URL
    try {
      console.log('Attempting to initialize Functions with direct URL')
      const projectId = config.firebase.projectId
      const customFunctionsInstance = getFunctions(app)

      // Workaround attempt to make functions available
      customFunctionsInstance._url = `https://${region}-${projectId}.cloudfunctions.net/`
      console.log('Set custom URL for Functions:', customFunctionsInstance._url)

      return customFunctionsInstance
    } catch (error) {
      console.error('Direct URL Functions initialization also failed:', error)
    }

    console.error('Error initializing Firebase Functions')

    console.log('Firebase project ID:', config.firebase.projectId)
    console.log('Firebase auth domain:', config.firebase.authDomain)
    console.log('Functions region:', config.firebase.functionsRegion)
    console.log('Use emulators:', config.useEmulators)

    console.log('Returning mock Functions instance due to initialization error')
    return createMockFunctionsInstance()
  } catch (error) {
    console.error('Error getting Firebase Functions instance:', error)
    return createMockFunctionsInstance()
  }
}

/**
 * Create a mock Functions instance for graceful degradation
 * @returns {Object} - A mock Functions instance
 */
function createMockFunctionsInstance() {
  console.warn('Using mock Functions instance. Some features may be limited.')

  return {
    _isMock: true,
    httpsCallable: (name) => {
      return async (data) => {
        console.warn(`Mock function call to ${name}:`, data)
        return { data: { success: false, error: 'Firebase Functions not available', _isMock: true } }
      }
    }
  }
}

// Export Firebase services
export {
  app,
  auth,
  db,
  storage,
  analytics,
  getFunctionsInstance
}

export default app
