// Update to use global Firebase variables
// import { auth, firestore, analytics } from '../../firebase/firebaseConfig.js';
import { EventBus } from '../utils/eventBus.js';

/**
 * Authentication Service - Handles user authentication operations
 */
export class AuthService {
  constructor() {
    this.currentUser = null;
    this.initialized = false;
    this.initializationError = null;

    // Wait for Firebase to be initialized
    window.addEventListener('firebase:initialized', this._handleFirebaseInitialized.bind(this));
    window.addEventListener('firebase:error', this._handleFirebaseError.bind(this));

    // Initialize if Firebase is already available
    if (window.firebaseAuth && window.firebaseFirestore) {
      this._initAuth();
    }
  }

  _handleFirebaseInitialized(event) {
    // Get Firebase objects from window
    this.auth = window.firebaseAuth;
    this.firestore = window.firebaseFirestore;
    this.analytics = window.firebaseAnalytics;

    if (this.auth && this.firestore) {
      this._initAuth();
    } else {
      this.initializationError = new Error('Firebase services not available after initialization');
      console.warn('Firebase services are not properly initialized:', this.initializationError);
      this._emitAuthState(null);
    }
  }

  _handleFirebaseError(event) {
    this.initializationError = event.detail.error;
    console.warn('Firebase services are not properly initialized:', this.initializationError);
    this._emitAuthState(null);
  }

  _initAuth() {
    if (!this.auth || !this.firestore) {
      this.initializationError = new Error('Firebase services not available');
      console.warn('Firebase services are not properly initialized:', this.initializationError);
      this._emitAuthState(null);
      return;
    }

    // Listen for auth state changes
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      this._emitAuthState(user);
      this.initialized = true;
    });
  }

  _emitAuthState(user) {
    EventBus.emit('auth:initialized', user);
    if (this.initializationError) {
      EventBus.emit('auth:error', this.initializationError);
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmailAndPassword(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      this.currentUser = userCredential.user;
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      await this.auth.signOut();
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get the current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get any initialization error
   */
  getInitializationError() {
    return this.initializationError;
  }

  /**
   * Create a new account with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Authentication promise
   */
  async createUserWithEmailPassword(email, password) {
    if (!this.auth) {
      const error = new Error('Firebase authentication is not available');
      error.code = 'auth/service-unavailable';
      throw error;
    }

    try {
      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('sign_up', { method: 'email' });
      }

      // Create user document in Firestore if available
      if (this.firestore && result.user) {
        await this._createUserDocument(result.user);
      }

      return result.user;
    } catch (error) {
      console.error('Create account error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google provider
   * @returns {Promise} - Authentication promise
   */
  async signInWithGoogle() {
    if (!this.auth || !window.firebase || !window.firebase.auth) {
      const error = new Error('Firebase authentication is not available');
      error.code = 'auth/service-unavailable';
      throw error;
    }

    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      const result = await this.auth.signInWithPopup(provider);
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('login_method', { method: 'google' });
      }

      // Create user document if it doesn't exist
      if (this.firestore && result.user) {
        await this._createUserDocument(result.user);
      }

      return result.user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Microsoft provider
   * @returns {Promise} - Authentication promise
   */
  async signInWithMicrosoft() {
    if (!this.auth || !window.firebase || !window.firebase.auth) {
      const error = new Error('Firebase authentication is not available');
      error.code = 'auth/service-unavailable';
      throw error;
    }

    try {
      const provider = new window.firebase.auth.OAuthProvider('microsoft.com');
      const result = await this.auth.signInWithPopup(provider);
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('login_method', { method: 'microsoft' });
      }

      // Create user document if it doesn't exist
      if (this.firestore && result.user) {
        await this._createUserDocument(result.user);
      }

      return result.user;
    } catch (error) {
      console.error('Microsoft sign in error:', error);
      throw error;
    }
  }

  /**
   * Create a user document in Firestore if it doesn't exist
   * @param {Object} user - Firebase user object
   * @returns {Promise} - Firestore operation promise
   * @private
   */
  async _createUserDocument(user) {
    if (!this.firestore || !window.firebase || !window.firebase.firestore) {
      console.warn('Firestore is not available, skipping user document creation');
      return Promise.resolve();
    }

    try {
      // Check if user document already exists
      const userDoc = await this.firestore.collection('users').doc(user.uid).get();

      if (!userDoc.exists) {
        // Create new user document
        await this.firestore.collection('users').doc(user.uid).set({
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: window.firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Update last login timestamp
        await this.firestore.collection('users').doc(user.uid).update({
          lastLogin: window.firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Create user document error:', error);
      // Don't throw the error to prevent authentication from failing
      // just because the user document couldn't be created
    }
  }

  /**
   * Wait for the authentication to be initialized
   * @returns {Promise} - Promise that resolves when auth is initialized
   */
  waitForInitialization() {
    return new Promise(resolve => {
      if (this.initialized) {
        resolve(this.currentUser);
      } else {
        const unsubscribe = EventBus.on('auth:initialized', user => {
          unsubscribe();
          resolve(user);
        });

        // Add a timeout to prevent waiting indefinitely
        setTimeout(() => {
          if (!this.initialized) {
            console.warn('Authentication initialization timed out');
            this.initialized = true;
            this.initializationError = new Error('Authentication initialization timed out');
            unsubscribe();
            resolve(null);
            EventBus.emit('auth:error', this.initializationError);
          }
        }, 5000); // 5 seconds timeout
      }
    });
  }
}

// Create and export a singleton instance
export const authService = new AuthService();
