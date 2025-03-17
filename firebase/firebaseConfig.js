/**
 * Firebase configuration
 * Replace with your own Firebase project configuration
 */

// Get environment variables from window object
const env = window.ENV || {
  ENVIRONMENT: 'DEV',
  FIREBASE_API_KEY: '',
  FIREBASE_AUTH_DOMAIN: '',
  FIREBASE_PROJECT_ID: '',
  FIREBASE_STORAGE_BUCKET: '',
  FIREBASE_MESSAGING_SENDER_ID: '',
  FIREBASE_APP_ID: '',
  FIREBASE_MEASUREMENT_ID: '',
  USE_EMULATORS: 'false'
};

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
if (!firebase.apps?.length) {
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

// Make Firebase components available globally
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseFirestore = firestore;
window.firebaseAnalytics = analytics;

// Export configuration for debugging purposes
window.firebaseConfig = {
  environment: env.ENVIRONMENT,
  projectId: firebaseConfig.projectId
};
