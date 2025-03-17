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

    // Get Firebase objects from window
    this.auth = window.firebaseAuth;
    this.firestore = window.firebaseFirestore;
    this.analytics = window.firebaseAnalytics;

    // Initialize authentication state
    this._initAuth();
  }

  /**
   * Initialize the authentication state listener
   * @private
   */
  _initAuth() {
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
      this.initialized = true;

      // Notify the application of auth state change
      if (user) {
        EventBus.emit('auth:login', user);
        this.analytics.setUserId(user.uid);
        this.analytics.logEvent('login');
      } else {
        EventBus.emit('auth:logout');
      }

      // Emit initialized event once
      EventBus.emit('auth:initialized', user);
    });
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
    try {
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      this.analytics.logEvent('login_method', { method: 'email' });
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
    try {
      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      this.analytics.logEvent('sign_up', { method: 'email' });

      // Create user document in Firestore
      await this._createUserDocument(result.user);

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
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await this.auth.signInWithPopup(provider);
      this.analytics.logEvent('login_method', { method: 'google' });

      // Create user document if it doesn't exist
      await this._createUserDocument(result.user);

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
    try {
      const provider = new firebase.auth.OAuthProvider('microsoft.com');
      const result = await this.auth.signInWithPopup(provider);
      this.analytics.logEvent('login_method', { method: 'microsoft' });

      // Create user document if it doesn't exist
      await this._createUserDocument(result.user);

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
    try {
      this.analytics.logEvent('logout');
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
    try {
      // Check if user document already exists
      const userDoc = await this.firestore.collection('users').doc(user.uid).get();

      if (!userDoc.exists) {
        // Create new user document
        await this.firestore.collection('users').doc(user.uid).set({
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Update last login timestamp
        await this.firestore.collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Create user document error:', error);
      throw error;
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
      }
    });
  }
}

// Singleton instance
export default new AuthService();
