/**
 * Firebase configuration and initialization
 */
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'
import config from '@/config'

// Firebase configuration object from environment variables
const firebaseConfig = config.env.firebaseConfig

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

// Initialize Auth
export const auth = getAuth(app)

// Initialize Firestore
export const db = getFirestore(app)

// Use emulators in development
if (process.env.NODE_ENV === 'development' && config.env.useEmulators) {
  console.log('Using Firebase emulators for development')
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
}

// Initialize Analytics conditionally
let analytics = null
// Only initialize analytics in production to avoid unnecessary data collection
if (process.env.NODE_ENV === 'production') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  }).catch(error => {
    console.warn('Firebase Analytics initialization failed:', error)
  })
}
export { analytics }

// Initialize Storage (optional, only for authenticated users)
let storage = null
try {
  storage = getStorage(app)
} catch (error) {
  console.warn('Firebase Storage initialization failed:', error)
}
export { storage }

// Enable offline persistence for Firestore (only when not using emulators)
if (!(process.env.NODE_ENV === 'development' && config.env.useEmulators)) {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.')
      }
    })
  } catch (error) {
    console.warn('Error enabling Firestore persistence:', error)
  }
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
