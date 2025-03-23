/**
 * Firebase configuration
 * Uses environment variables securely loaded at runtime
 */

// Wait for environment to be loaded before initializing Firebase
document.addEventListener('DOMContentLoaded', setupFirebaseInitialization);

// Setup event listeners for environment loading
function setupFirebaseInitialization() {
  // Check if the environment is already loaded
  if (window.ENV && window.ENV.FIREBASE_API_KEY) {
    initializeFirebase();
  } else {
    // Wait for the environment to be loaded
    window.addEventListener('env:loaded', initializeFirebase);

    // Handle environment loading errors
    window.addEventListener('env:error', handleEnvironmentError);
  }
}

// Handle environment loading errors
function handleEnvironmentError(event) {
  console.error('Failed to load environment configuration. Firebase will be initialized with fallback values.', event.detail);
  initializeFirebase();
}

// Initialize Firebase when the environment is ready
function initializeFirebase() {
  // First check if Firebase library is available
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not found. Make sure Firebase scripts are loaded properly.');
    showFirebaseConfigurationAlert('Firebase SDK not available. Application functionality will be limited.');
    createDummyImplementations(new Error('Firebase SDK not available'));
    return;
  }

  // Get environment variables from window object
  const env = window.ENV || {
    ENVIRONMENT: 'UNKNOWN',
    USE_EMULATORS: 'false',
    CONFIG_INCOMPLETE: true
  };

  // Check if configuration is incomplete
  if (env.CONFIG_INCOMPLETE) {
    console.error('Configuration is incomplete. Firebase services will not be initialized.');
    showFirebaseConfigurationAlert('Configuration Error: Unable to load Firebase configuration. Please check your network connection and try again.');
    createDummyImplementations(new Error('Configuration incomplete'));
    return;
  }

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
  let auth = null;
  let firestore = null;
  let analytics = null;

  // Check if Firebase config is valid
  const isFirebaseConfigValid = () => {
    return firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== '' &&
      firebaseConfig.authDomain && firebaseConfig.projectId;
  };

  // Display a user-friendly error message if Firebase config is invalid
  const showFirebaseConfigurationAlert = (message = 'Firebase configuration is invalid. Authentication and database features will be disabled.') => {
    console.warn('Invalid Firebase configuration. Authentication and database features will be disabled.');

    try {
      const alertEl = document.getElementById('firebase-error-alert');
      if (alertEl) {
        // Set error message if element exists
        const messageEl = document.getElementById('firebase-error-message');
        if (messageEl) {
          messageEl.textContent = message;
        }

        alertEl.classList.remove('hidden');

        // Add close button event listener
        const closeBtn = document.getElementById('firebase-error-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            alertEl.classList.add('hidden');
          });
        }

        // Auto-hide after 10 seconds
        setTimeout(() => {
          alertEl.classList.add('hidden');
        }, 10000);
      }
    } catch (error) {
      console.error('Error showing Firebase configuration alert:', error);
    }
  };

  // Create dummy implementations to prevent errors when Firebase is not available
  const createDummyImplementations = (error) => {
    auth = {
      onAuthStateChanged: (callback, onError) => {
        try {
          callback(null);
        } catch (e) {
          console.error('Error in onAuthStateChanged callback:', e);
          if (onError) onError(e);
        }
        return () => { };
      },
      signInWithEmailAndPassword: () => Promise.reject(error || new Error('Firebase not configured')),
      createUserWithEmailAndPassword: () => Promise.reject(error || new Error('Firebase not configured')),
      signInWithPopup: () => Promise.reject(error || new Error('Firebase not configured')),
      signOut: () => Promise.resolve(),
      currentUser: null
    };

    firestore = {
      collection: (collectionName) => ({
        doc: (docId) => ({
          get: () => Promise.resolve({
            exists: false,
            data: () => null,
            id: docId
          }),
          set: (data) => {
            console.log(`Mock set data for ${collectionName}/${docId}:`, data);
            return Promise.resolve();
          },
          update: (data) => {
            console.log(`Mock update data for ${collectionName}/${docId}:`, data);
            return Promise.resolve();
          }
        }),
        add: (data) => {
          const id = `mock-${Date.now()}`;
          console.log(`Mock add data to ${collectionName} with ID ${id}:`, data);
          return Promise.resolve({ id });
        },
        where: () => ({
          get: () => Promise.resolve({
            empty: true,
            docs: [],
            forEach: () => { }
          })
        }),
        onSnapshot: (callback) => {
          // Immediately call with empty data
          callback({
            empty: true,
            docs: [],
            forEach: () => { }
          });
          return () => { }; // Unsubscribe function
        }
      })
    };

    // Make Firebase components available globally
    window.firebaseApp = null;
    window.firebaseAuth = auth;
    window.firebaseFirestore = firestore;
    window.firebaseAnalytics = null;

    // Export configuration for debugging purposes
    window.firebaseConfig = {
      environment: env.ENVIRONMENT,
      isConfigured: false,
      usingEmulators: false,
      configIncomplete: true
    };

    // Dispatch event to signal Firebase initialization failure
    window.dispatchEvent(new CustomEvent('firebase:error', {
      detail: { error: error || new Error('Firebase not configured') }
    }));

    // Also dispatch initialized event to ensure application continues
    window.dispatchEvent(new CustomEvent('firebase:initialized', {
      detail: { environment: env.ENVIRONMENT }
    }));
  };

  try {
    if (isFirebaseConfigValid()) {
      console.log(`Initializing Firebase for ${env.ENVIRONMENT} environment`);

      // Check if any Firebase apps have been initialized already
      if (!firebase.apps?.length) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.app();
      }

      // Initialize Firebase services
      analytics = env.ENVIRONMENT === 'PRD' ? firebase.analytics() : null;
      firestore = firebase.firestore();
      auth = firebase.auth();

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

      // Export configuration for debugging purposes (with sensitive info removed)
      window.firebaseConfig = {
        environment: env.ENVIRONMENT,
        isConfigured: true,
        usingEmulators: env.ENVIRONMENT === 'LOCAL' && env.USE_EMULATORS === 'true'
      };

      // Dispatch event to signal Firebase is initialized
      window.dispatchEvent(new CustomEvent('firebase:initialized', {
        detail: { environment: env.ENVIRONMENT }
      }));
    } else {
      console.warn('Invalid Firebase configuration. Authentication and database features will be disabled.');
      // Show user-friendly alert
      showFirebaseConfigurationAlert();
      // Create dummy implementations
      createDummyImplementations();
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Show user-friendly alert
    showFirebaseConfigurationAlert('Firebase initialization error. Application functionality will be limited.');
    // Create dummy implementations
    createDummyImplementations(error);
  }
}
