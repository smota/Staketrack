/**
 * Firebase configuration and initialization
 */
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'
import config from '@/config'

// Check for anonymous mode with missing Firebase config
const isAnonymousMode = !config.env.firebaseConfig.apiKey || !config.env.firebaseConfig.projectId

// If in anonymous mode and missing required config, create a minimal placeholder configuration
let firebaseConfig = config.env.firebaseConfig
if (isAnonymousMode) {
  console.log('Using anonymous mode with minimal Firebase configuration')
  firebaseConfig = {
    apiKey: firebaseConfig.apiKey || 'anonymous-mode-api-key',
    authDomain: firebaseConfig.authDomain || 'anonymous-mode.firebaseapp.com',
    projectId: firebaseConfig.projectId || 'anonymous-mode',
    storageBucket: firebaseConfig.storageBucket || '',
    messagingSenderId: firebaseConfig.messagingSenderId || '000000000000',
    appId: firebaseConfig.appId || '1:000000000000:web:0000000000000000000000',
    measurementId: firebaseConfig.measurementId || ''
  }
}

/**
 * Initialize Firebase services
 */
let app
try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
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

// Use emulators in development
if (process.env.NODE_ENV === 'development' && config.env.useEmulators) {
  console.log('Using Firebase emulators for development')
  try {
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
  } catch (error) {
    console.error('Error connecting to emulators:', error)
  }
}

// Initialize Analytics conditionally
let analytics = null
if (process.env.NODE_ENV === 'production') {
  isSupported().then(supported => {
    if (supported && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app)
      } catch (error) {
        console.warn('Firebase Analytics initialization failed:', error)
      }
    }
  }).catch(error => {
    console.warn('Firebase Analytics support check failed:', error)
  })
}
export { analytics }

// Cache for lazy-loaded Storage instance
let storage = null

/**
 * Get Firebase Storage instance, initializing it only when needed and when user is logged in
 * @returns {Object|null} Firebase Storage instance or null if unavailable
 */
export const getFirebaseStorage = () => {
  // If storage is already initialized, return the cached instance
  if (storage) {
    return storage
  }

  // Only initialize Storage if user is logged in
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

// Enable offline persistence for Firestore (only when not using emulators)
if (!(process.env.NODE_ENV === 'development' && config.env.useEmulators)) {
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
