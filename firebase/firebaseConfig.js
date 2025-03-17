/**
 * Firebase configuration
 * Replace with your own Firebase project configuration
 */
import { env } from '../js/utils/environmentLoader.js';

// Firebase configuration based on environment
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Initialize Firebase components based on environment
const app = initializeApp(firebaseConfig);
const analytics = env.ENVIRONMENT === 'PRD' ? getAnalytics(app) : null;
const firestore = getFirestore(app);
const auth = getAuth(app);

// Enable Firestore emulator for development if needed
if (env.ENVIRONMENT === 'DEV' && env.USE_EMULATORS === 'true') {
  const { connectFirestoreEmulator } = require('firebase/firestore');
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  
  const { connectAuthEmulator } = require('firebase/auth');
  connectAuthEmulator(auth, 'http://localhost:9099');
}

export { app, analytics, firestore, auth };

// Export configuration for debugging purposes
export const currentConfig = {
  environment: env.ENVIRONMENT,
  projectId: firebaseConfig.projectId
};
