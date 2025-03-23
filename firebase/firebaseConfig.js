/**
 * Firebase configuration
 * Uses environment variables securely loaded at runtime
 */

// Wait for Firebase SDK to load
document.addEventListener('DOMContentLoaded', initializeFirebase);

// Initialize Firebase when the document is ready
function initializeFirebase() {
  // Get environment variables from window object
  const env = window.ENV || {
    ENVIRONMENT: 'DEV',
    USE_EMULATORS: 'false'
  };

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
  const showFirebaseConfigurationAlert = () => {
    try {
      const alertEl = document.getElementById('firebase-error-alert');
      if (alertEl) {
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

  try {
    if (isFirebaseConfigValid()) {
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

      // Enable Firestore emulator for development if needed
      if (env.ENVIRONMENT === 'DEV' && env.USE_EMULATORS === 'true') {
        firestore.useEmulator('localhost', 8080);
        auth.useEmulator('http://localhost:9099');
      }
    } else {
      console.warn('Invalid Firebase configuration. Authentication and database features will be disabled.');
      // Show user-friendly alert
      showFirebaseConfigurationAlert();

      // Create dummy implementations to prevent errors
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
        signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
        createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
        signInWithPopup: () => Promise.reject(new Error('Firebase not configured')),
        signOut: () => Promise.resolve()
      };
      firestore = {
        collection: () => ({
          doc: () => ({
            get: () => Promise.resolve({ exists: false }),
            set: () => Promise.resolve(),
            update: () => Promise.resolve()
          })
        })
      };
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Show user-friendly alert
    showFirebaseConfigurationAlert();

    // Create dummy implementations
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
      signInWithEmailAndPassword: () => Promise.reject(error),
      createUserWithEmailAndPassword: () => Promise.reject(error),
      signInWithPopup: () => Promise.reject(error),
      signOut: () => Promise.resolve()
    };
    firestore = {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve()
        })
      })
    };
  }

  // Make Firebase components available globally
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseFirestore = firestore;
  window.firebaseAnalytics = analytics;

  // Export configuration for debugging purposes (with sensitive info removed)
  window.firebaseConfig = {
    environment: env.ENVIRONMENT,
    isConfigured: isFirebaseConfigValid()
  };
}
