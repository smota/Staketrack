/**
 * Firebase configuration
 * Uses environment variables securely loaded at runtime
 */

// Wait for environment to be loaded before initializing Firebase
document.addEventListener('DOMContentLoaded', setupFirebaseInitialization);

// Setup event listeners for environment loading
function setupFirebaseInitialization() {
  // Check if the environment is already loaded
  if (window.ENV && !window.ENV.CONFIG_INCOMPLETE) {
    initializeFirebase();
  } else {
    // Wait for the environment to be loaded
    window.addEventListener('env:loaded', (event) => {
      if (!event.detail.CONFIG_INCOMPLETE) {
        initializeFirebase();
      }
    });

    // Handle environment loading errors
    window.addEventListener('env:error', handleEnvironmentError);
  }
}

// Handle environment loading errors
function handleEnvironmentError(event) {
  console.error('Failed to load environment configuration:', event.detail.error);
  createDummyImplementations(event.detail.error);
}

// Initialize Firebase when the environment is ready
function initializeFirebase() {
  try {
    // First check if Firebase library is available
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK not found');
    }

    // Get environment variables from window object
    const env = window.ENV;

    if (!env || env.CONFIG_INCOMPLETE) {
      throw new Error('Firebase configuration is incomplete');
    }

    // Firebase configuration
    const firebaseConfig = {
      apiKey: env.FIREBASE_API_KEY,
      authDomain: env.FIREBASE_AUTH_DOMAIN,
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
      appId: env.FIREBASE_APP_ID,
      measurementId: env.FIREBASE_MEASUREMENT_ID
    };

    // Check if Firebase config is valid
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      throw new Error('Invalid Firebase configuration');
    }

    console.log(`Initializing Firebase for ${env.ENVIRONMENT} environment`);

    // Initialize Firebase if not already initialized
    let app;
    if (!firebase.apps?.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }

    // Initialize Firebase services
    const analytics = env.ENVIRONMENT === 'PRD' ? firebase.analytics() : null;
    const firestore = firebase.firestore();
    const auth = firebase.auth();

    // Enable Firestore emulator for LOCAL environment
    if (env.ENVIRONMENT === 'LOCAL' && env.USE_EMULATORS === 'true') {
      console.log('Using Firebase emulators for local development');
      firestore.useEmulator('localhost', 8080);
      auth.useEmulator('http://localhost:9099');
    }

    // Make Firebase components available globally
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseFirestore = firestore;
    window.firebaseAnalytics = analytics;

    // Dispatch event to signal Firebase is initialized
    window.dispatchEvent(new CustomEvent('firebase:initialized', {
      detail: { environment: env.ENVIRONMENT }
    }));

  } catch (error) {
    console.error('Firebase initialization error:', error);
    createDummyImplementations(error);
  }
}

function createDummyImplementations(error) {
  // Create dummy auth
  const auth = {
    onAuthStateChanged: (callback) => {
      setTimeout(() => callback(null), 100);
      return () => { };
    },
    signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
    createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
    signInWithPopup: () => Promise.reject(new Error('Firebase not configured')),
    signOut: () => Promise.resolve(),
    currentUser: null
  };

  // Create dummy firestore
  const firestore = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.reject(new Error('Firebase not configured')),
        set: () => Promise.reject(new Error('Firebase not configured')),
        update: () => Promise.reject(new Error('Firebase not configured')),
        delete: () => Promise.reject(new Error('Firebase not configured'))
      }),
      add: () => Promise.reject(new Error('Firebase not configured')),
      where: () => ({
        get: () => Promise.reject(new Error('Firebase not configured'))
      })
    })
  };

  // Make Firebase components available globally
  window.firebaseApp = null;
  window.firebaseAuth = auth;
  window.firebaseFirestore = firestore;
  window.firebaseAnalytics = null;

  // Dispatch events to signal Firebase initialization status
  window.dispatchEvent(new CustomEvent('firebase:error', {
    detail: { error }
  }));

  window.dispatchEvent(new CustomEvent('firebase:initialized', {
    detail: { environment: window.ENV?.ENVIRONMENT || 'UNKNOWN' }
  }));
}
