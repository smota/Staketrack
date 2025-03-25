/**
 * Firebase Service Module
 * Centralized access to Firebase services with improved initialization
 */

import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'
import config from '../config'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APP_ID,
  measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Initialize Firebase emulators for local development
if (process.env.NODE_ENV === 'development' && process.env.VUE_APP_USE_EMULATORS === 'true') {
  console.log('Using Firebase emulators for local development')
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
}

// Initialize analytics in production only
let analytics = null
const initAnalytics = async () => {
  if (process.env.NODE_ENV === 'production' && config.features.analytics) {
    try {
      const analyticsSupported = await isSupported()
      if (analyticsSupported) {
        analytics = getAnalytics(app)
        console.log('Firebase Analytics initialized')
        return analytics
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error)
    }
  }
  return null
}

// Initialize analytics
initAnalytics()

/**
 * Check if we have valid Firebase config
 * @returns {boolean} True if Firebase config is valid
 */
export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId
}

/**
 * Get Firebase app instance
 * @returns {object} Firebase app instance
 */
export const getFirebaseApp = () => app

/**
 * Get Firebase auth instance
 * @returns {object} Firebase auth instance
 */
export const getFirebaseAuth = () => auth

/**
 * Get Firebase firestore instance
 * @returns {object} Firebase firestore instance
 */
export const getFirebaseFirestore = () => db

/**
 * Get Firebase analytics instance
 * @returns {object|null} Firebase analytics instance or null if not initialized
 */
export const getFirebaseAnalytics = () => analytics

/**
 * Export Firebase environment info
 */
export const getFirebaseEnv = () => ({
  environment: process.env.NODE_ENV,
  isConfigured: isFirebaseConfigured(),
  usingEmulators: process.env.NODE_ENV === 'development' && process.env.VUE_APP_USE_EMULATORS === 'true'
})

export default {
  app,
  auth,
  db,
  analytics,
  isFirebaseConfigured,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseAnalytics,
  getFirebaseEnv
} 