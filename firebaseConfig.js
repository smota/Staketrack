// Replace placeholder values with actual Firebase config values
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.FIREBASE_APP_ID || "your-app-id",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "your-measurement-id"
};

// Initialize Firebase properly with fallbacks for guest mode
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const analytics = firebase.analytics ? firebase.analytics() : null;

// Add a guest mode handler
const handleGuestMode = () => {
  // Implement offline/local storage mode when not authenticated
  console.log("Guest mode active - using local storage");
  // Additional guest mode logic...
};

// When auth state changes
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    EventBus.emit('auth:login', user);
  } else {
    // User is signed out or in guest mode
    EventBus.emit('auth:logout');
    handleGuestMode();
  }
  EventBus.emit('auth:initialized', user);
}); 