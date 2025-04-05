/**
 * Firebase configuration and initialization
 */
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable
} from 'firebase/functions'
import { getAnalytics, isSupported } from 'firebase/analytics'
import config from '@/config'

// Using environment-provided Firebase configuration
const firebaseConfig = config.env.firebaseConfig

// Log the Firebase configuration being used (without sensitive values)
console.log('Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId || 'not set',
  authDomain: firebaseConfig.authDomain || 'not set',
  storageBucket: firebaseConfig.storageBucket || 'not set',
  useEmulators: config.env.useEmulators || false,
  functionsRegion: config.env.firebase?.functionsRegion || 'not set'
})

/**
 * Initialize Firebase services
 */
let app
try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    console.log('Initializing Firebase app for the first time...')
    // Validate that we have the minimal required config
    if (!firebaseConfig.projectId) {
      console.error('Missing required Firebase project ID')
      throw new Error('Firebase project ID is required')
    }
    app = initializeApp(firebaseConfig)
    console.log('Firebase app initialized successfully with project ID:', firebaseConfig.projectId)
  } else {
    console.log('Firebase already initialized, retrieving existing app')
    app = getApps()[0]
  }
} catch (error) {
  console.error('Error initializing Firebase:', error)
  throw error
}

// Export Firebase app instance
export const firebaseApp = app

// Initialize Auth with error handling
let auth
try {
  auth = getAuth(app)
} catch (error) {
  console.error('Error initializing Firebase Auth:', error)
  throw error
}
export { auth }

// Initialize Firestore with error handling
let db
try {
  db = getFirestore(app)
} catch (error) {
  console.error('Error initializing Firestore:', error)
  throw error
}
export { db }

// Functions initialization - using lazy loading pattern
let _functions = null

/**
 * Get Firebase Functions instance, initializing it only when needed
 * @returns {Object} Firebase Functions instance
 */
export const getFunctionsInstance = () => {
  if (_functions) {
    return _functions
  }

  try {
    // Check if we have a valid Firebase config
    if (!firebaseConfig.projectId) {
      console.error('Firebase project ID is missing, cannot initialize Functions')
      throw new Error('Firebase project ID is required to initialize Functions')
    }

    // Set the region for functions
    const functionsRegion = config.env.firebase?.functionsRegion || 'europe-west1'

    // Initialize the Functions instance with region
    _functions = getFunctions(app, functionsRegion)

    // Connect to emulator if configured in environment
    if (config.env.useEmulators) {
      const emulatorHost = 'localhost'
      const emulatorPort = process.env.APP_EMULATOR_FUNCTIONS_PORT || '5001'
      connectFunctionsEmulator(_functions, emulatorHost, parseInt(emulatorPort, 10))
    }

    return _functions
  } catch (error) {
    console.error('Error initializing Firebase Functions:', error)
    throw error
  }
}

// Storage initialization
let storage = null

// Connect to emulators when configured
if (config.env.useEmulators) {
  try {
    // Connect Auth emulator
    connectAuthEmulator(auth, `http://localhost:${process.env.APP_EMULATOR_AUTH_PORT}`)
  } catch (error) {
    console.error('Error connecting to Auth emulator:', error)
  }

  try {
    // Connect Firestore emulator
    connectFirestoreEmulator(db, 'localhost', parseInt(process.env.APP_EMULATOR_FIRESTORE_PORT, 10))
  } catch (error) {
    console.error('Error connecting to Firestore emulator:', error)
  }
}

/**
 * Get Firebase Storage instance
 * @returns {Object|null} Firebase Storage instance or null if unavailable
 */
export const getFirebaseStorage = () => {
  // Return cached instance if available
  if (storage) {
    return storage
  }

  // For emulators, initialize on demand
  if (config.env.useEmulators) {
    try {
      storage = getStorage(app)

      try {
        connectStorageEmulator(
          storage,
          'localhost',
          parseInt(process.env.APP_EMULATOR_STORAGE_PORT, 10)
        )
      } catch (connError) {
        console.error('Error connecting to Storage emulator:', connError)
      }

      return storage
    } catch (error) {
      console.error('Firebase Storage initialization failed:', error)
      return null
    }
  }

  // For production, only initialize if authenticated
  if (auth.currentUser && firebaseConfig.storageBucket) {
    try {
      storage = getStorage(app)
      return storage
    } catch (error) {
      console.error('Firebase Storage initialization failed:', error)
      return null
    }
  }

  return null
}

// Initialize Analytics conditionally for production only
let analytics = null

// In development or emulator mode, provide a dummy implementation
if (process.env.NODE_ENV !== 'production' || config.env.useEmulators) {
  analytics = {
    logEvent: () => { },
    setUserId: () => { },
    setUserProperties: () => { }
  }
} else {
  // Only try to initialize analytics in production
  isSupported().then(supported => {
    if (supported && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app)
      } catch (error) {
        console.warn('Firebase Analytics initialization failed:', error)
        // Provide fallback implementation if analytics fails
        analytics = {
          logEvent: () => { },
          setUserId: () => { },
          setUserProperties: () => { }
        }
      }
    } else {
      // Provide fallback for unsupported browsers
      analytics = {
        logEvent: () => { },
        setUserId: () => { },
        setUserProperties: () => { }
      }
    }
  }).catch(() => {
    // Fallback for any promise rejection
    analytics = {
      logEvent: () => { },
      setUserId: () => { },
      setUserProperties: () => { }
    }
  })
}

export { analytics }

// Enable offline persistence for Firestore (only in production)
if (!config.env.useEmulators) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.')
    } else {
      console.warn('Error enabling Firestore persistence:', err)
    }
  })
}

/**
 * Initialize Firebase Auth state tracking
 * @param {Function} onAuthStateChanged - Callback to be called when auth state changes
 * @returns {Function} Unsubscribe function
 */
export const trackAuthState = (onAuthStateChanged) => {
  if (!onAuthStateChanged || typeof onAuthStateChanged !== 'function') {
    throw new Error('onAuthStateChanged must be a valid function')
  }

  return auth.onAuthStateChanged(onAuthStateChanged)
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser
}
