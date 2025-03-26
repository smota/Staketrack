import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/analytics'

/**
 * Authentication Service - Handles user authentication operations
 */
class AuthService {
  constructor() {
    this.currentUser = null
    this.initialized = false
    this.initializationError = null

    // Initialize authentication state when Firebase is available
    this._initAuth()
  }

  /**
   * Initialize the authentication state listener
   * @private
   */
  _initAuth() {
    try {
      firebase.auth().onAuthStateChanged(user => {
        this.currentUser = user
        this.initialized = true

        if (user && firebase.analytics) {
          firebase.analytics().setUserId(user.uid)
          firebase.analytics().logEvent('login')
        }
      }, error => {
        console.error('Auth state change error:', error)
        this.initialized = true
        this.initializationError = error
      })
    } catch (error) {
      console.error('Failed to initialize auth state listener:', error)
      this.initialized = true
      this.initializationError = error
    }
  }

  /**
   * Get the current authenticated user
   * @returns {Object|null} - Firebase user object or null if not authenticated
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * Check if a user is authenticated
   * @returns {boolean} - True if user is authenticated, false otherwise
   */
  isAuthenticated() {
    return !!this.currentUser
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Authentication promise
   */
  async signInWithEmailPassword(email, password) {
    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password)
      if (firebase.analytics) {
        firebase.analytics().logEvent('login_method', { method: 'email' })
      }
      return result.user
    } catch (error) {
      console.error('Email sign in error:', error)
      throw error
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
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password)
      if (firebase.analytics) {
        firebase.analytics().logEvent('sign_up', { method: 'email' })
      }

      // Create user document in Firestore
      if (result.user) {
        await this._createUserDocument(result.user)
      }

      return result.user
    } catch (error) {
      console.error('Create account error:', error)
      throw error
    }
  }

  /**
   * Sign in with Google provider
   * @returns {Promise} - Authentication promise
   */
  async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider()
      const result = await firebase.auth().signInWithPopup(provider)
      if (firebase.analytics) {
        firebase.analytics().logEvent('login_method', { method: 'google' })
      }

      // Create user document if it doesn't exist
      if (result.user) {
        await this._createUserDocument(result.user)
      }

      return result.user
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise} - Sign out promise
   */
  async signOut() {
    try {
      if (firebase.analytics) {
        firebase.analytics().logEvent('logout')
      }
      return await firebase.auth().signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
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
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get()

      if (!userDoc.exists) {
        // Create new user document
        await firebase.firestore().collection('users').doc(user.uid).set({
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        })
      } else {
        // Update last login
        await firebase.firestore().collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Error creating/updating user document:', error)
      throw error
    }
  }

  /**
   * Wait for authentication to initialize
   * @returns {Promise} - Promise that resolves when auth is initialized
   */
  waitForInitialization() {
    if (this.initialized) {
      return Promise.resolve(this.currentUser)
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.initialized) {
          clearInterval(checkInterval)
          resolve(this.currentUser)
        }
      }, 100)
    })
  }
}

// Export singleton instance
export const authService = new AuthService()
