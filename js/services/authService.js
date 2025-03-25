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

    // Get Firebase objects from window
    this.auth = window.firebaseAuth;
    this.firestore = window.firebaseFirestore;
    this.analytics = window.firebaseAnalytics;

    // Check if Firebase is configured properly
    if (!this.auth || !this.firestore) {
      this.initializationError = new Error('Firebase services not available');
      console.warn('Firebase services are not properly initialized:', this.initializationError);
      // Mark as initialized to prevent waiting indefinitely
      this.initialized = true;
      // Emit initialized event
      setTimeout(() => {
        EventBus.emit('auth:initialized', null);
        EventBus.emit('auth:error', this.initializationError);
      }, 0);
    } else {
      // Initialize authentication state
      this._initAuth();
    }
  }

  /**
   * Initialize the authentication state listener
   * @private
   */
  _initAuth() {
    try {
      this.auth.onAuthStateChanged(user => {
        this.currentUser = user;
        this.initialized = true;

        // Notify the application of auth state change
        if (user) {
          EventBus.emit('auth:login', user);
          if (this.analytics && typeof this.analytics.logEvent === 'function') {
            this.analytics.setUserId(user.uid);
            this.analytics.logEvent('login');
          }
        } else {
          EventBus.emit('auth:logout');
        }

        // Emit initialized event once
        EventBus.emit('auth:initialized', user);
      }, error => {
        console.error('Auth state change error:', error);
        this.initialized = true;
        this.initializationError = error;
        EventBus.emit('auth:error', error);
        EventBus.emit('auth:initialized', null);
      });
    } catch (error) {
      console.error('Failed to initialize auth state listener:', error);
      this.initialized = true;
      this.initializationError = error;
      EventBus.emit('auth:error', error);
      EventBus.emit('auth:initialized', null);
    }
  }

  /**
   * Get the current authenticated user
   * @returns {Object|null} - Firebase user object or null if not authenticated
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if a user is authenticated
   * @returns {boolean} - True if user is authenticated, false otherwise
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Authentication promise
   */
  async signInWithEmailPassword(email, password) {
    if (!this.auth) {
      const error = new Error('Firebase authentication is not available');
      error.code = 'auth/service-unavailable';
      throw error;
    }

    try {
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('login_method', { method: 'email' });
      }
      return result.user;
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
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
   * Sign out the current user
   * @returns {Promise} - Sign out promise
   */
  async signOut() {
    if (!this.auth) {
      return Promise.resolve();
    }

    try {
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('logout');
      }
      return await this.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
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

// Singleton instance
export default new AuthService();
