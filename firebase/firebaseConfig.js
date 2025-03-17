/**
 * Firebase configuration
 * Replace with your own Firebase project configuration
 */
import { env } from '../js/utils/environmentLoader.js';

// Import Firebase
import firebase from 'firebase';

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

// Initialize Firebase components based on environment
let app;
// Check if any Firebase apps have been initialized already
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const analytics = env.ENVIRONMENT === 'PRD' ? firebase.analytics() : null;
const firestore = firebase.firestore();
const auth = firebase.auth();

// Enable Firestore emulator for development if needed
if (env.ENVIRONMENT === 'DEV' && env.USE_EMULATORS === 'true') {
  firestore.useEmulator('localhost', 8080);
  auth.useEmulator('http://localhost:9099');
}

export { app, analytics, firestore, auth };

// Export configuration for debugging purposes
export const currentConfig = {
  environment: env.ENVIRONMENT,
  projectId: firebaseConfig.projectId
};
