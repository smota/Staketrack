import { auth, firestore, analytics } from '../../../firebase/firebaseConfig.js';
import { EventBus } from '../utils/eventBus.js';

/**
 * Authentication Service - Handles user authentication operations
 */
export class AuthService {
  constructor() {
    this.currentUser = null;
    this.initialized = false;
    
    // Initialize authentication state
    this._initAuth();
  }
  
  /**
   * Initialize the authentication state listener
   * @private
   */
  _initAuth() {
    auth.onAuthStateChanged(user => {
      this.currentUser = user;
      this.initialized = true;
      
      // Notify the application of auth state change
      if (user) {
        EventBus.emit('auth:login', user);
        analytics.setUserId(user.uid);
        analytics.logEvent('login');
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
      const result = await auth.signInWithEmailAndPassword(email, password);
      analytics.logEvent('login_method', { method: 'email' });
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
      const result = await auth.createUserWithEmailAndPassword(email, password);
      analytics.logEvent('sign_up', { method: 'email' });
      
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
      const result = await auth.signInWithPopup(provider);
      analytics.logEvent('login_method', { method: 'google' });
      
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
      const result = await auth.signInWithPopup(provider);
      analytics.logEvent('login_method', { method: 'microsoft' });
      
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
      analytics.logEvent('logout');
      return await auth.signOut();
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
      const userDoc = await firestore.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create new user document
        await firestore.collection('users').doc(user.uid).set({
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Update last login timestamp
        await firestore.collection('users').doc(user.uid).update({
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
