/**
 * Firebase configuration and initialization
 */
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import config from '@/config'

// Firebase configuration object from environment variables
const firebaseConfig = config.env.firebaseConfig

/**
 * Initialize Firebase services
 */
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

// Enable Firestore offline persistence in production
if (config.env.isProduction) {
  import('firebase/firestore').then(({ enablePersistence }) => {
    enablePersistence({ synchronizeTabs: true })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time
          console.warn('Firebase persistence could not be enabled: multiple tabs open')
        } else if (err.code === 'unimplemented') {
          // The current browser does not support all of the features required to enable persistence
          console.warn('Firebase persistence is not available in this browser')
        }
      })
  })
}

export { app, db, auth, storage }

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

export default { app, db, auth, storage, trackAuthState, getCurrentUser } 