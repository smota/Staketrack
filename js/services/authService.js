// Update to use global Firebase variables
// import { auth, firestore, analytics } from '../../firebase/firebaseConfig.js';
import { EventBus } from '../utils/eventBus.js'

/**
 * Authentication Service - Handles user authentication operations
 */
export class AuthService {
  constructor() {
    this.currentUser = null
    this.initialized = false
    this.initializationError = null

    // Wait for Firebase initialization
    this._waitForFirebaseInit()
  }

  /**
   * Wait for Firebase to be initialized before setting up auth
   * @private
   */
  _waitForFirebaseInit() {
    if (window.firebaseAuth && window.firebaseFirestore) {
      this._initAuth()
    } else {
      // Wait for Firebase initialization event
      const initListener = () => {
        window.removeEventListener('firebase:initialized', initListener)
        this._initAuth()
      }

      const errorListener = (event) => {
        window.removeEventListener('firebase:error', errorListener)
        this.initializationError = event.detail.error
        console.error('Firebase initialization error:', this.initializationError)
        this.initialized = true
        EventBus.emit('auth:error', this.initializationError)
      }

      window.addEventListener('firebase:initialized', initListener)
      window.addEventListener('firebase:error', errorListener)

      // Fallback timeout
      setTimeout(() => {
        window.removeEventListener('firebase:initialized', initListener)
        window.removeEventListener('firebase:error', errorListener)
        this.initializationError = new Error('Firebase initialization timeout')
        console.error('Firebase initialization timeout')
        this.initialized = true
        EventBus.emit('auth:error', this.initializationError)
      }, 5000)
    }
  }

  /**
   * Initialize authentication state
   * @private
   */
  _initAuth() {
    if (!window.firebaseAuth) {
      this.initializationError = new Error('Firebase Auth not available')
      console.error('Firebase Auth not available')
      this.initialized = true
      EventBus.emit('auth:error', this.initializationError)
      return
    }

    // Get Firebase objects from window
    this.auth = window.firebaseAuth
    this.firestore = window.firebaseFirestore
    this.analytics = window.firebaseAnalytics

    // Set up auth state listener
    this.auth.onAuthStateChanged(
      (user) => {
        this.currentUser = user
        this.initialized = true
        EventBus.emit('auth:stateChanged', user)
      },
      (error) => {
        console.error('Auth state change error:', error)
        this.initializationError = error
        EventBus.emit('auth:error', error)
      }
    )
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
    if (!this.auth) {
      const error = new Error('Firebase authentication is not available')
      error.code = 'auth/service-unavailable'
      throw error
    }

    try {
      const result = await this.auth.signInWithEmailAndPassword(email, password)
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('login_method', { method: 'email' })
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
    if (!this.auth) {
      const error = new Error('Firebase authentication is not available')
      error.code = 'auth/service-unavailable'
      throw error
    }

    try {
      const result = await this.auth.createUserWithEmailAndPassword(email, password)
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('sign_up', { method: 'email' })
      }

      // Create user document in Firestore if available
      if (this.firestore && result.user) {
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
    if (!this.auth || !window.firebase || !window.firebase.auth) {
      const error = new Error('Firebase authentication is not available')
      error.code = 'auth/service-unavailable'
      throw error
    }

    try {
      const provider = new window.firebase.auth.GoogleAuthProvider()
      const result = await this.auth.signInWithPopup(provider)
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('login_method', { method: 'google' })
      }

      // Create user document if it doesn't exist
      if (this.firestore && result.user) {
        await this._createUserDocument(result.user)
      }

      return result.user
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  /**
   * Sign in with Microsoft provider
   * @returns {Promise} - Authentication promise
   */
  async signInWithMicrosoft() {
    if (!this.auth || !window.firebase || !window.firebase.auth) {
      const error = new Error('Firebase authentication is not available')
      error.code = 'auth/service-unavailable'
      throw error
    }

    try {
      const provider = new window.firebase.auth.OAuthProvider('microsoft.com')
      const result = await this.auth.signInWithPopup(provider)
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('login_method', { method: 'microsoft' })
      }

      // Create user document if it doesn't exist
      if (this.firestore && result.user) {
        await this._createUserDocument(result.user)
      }

      return result.user
    } catch (error) {
      console.error('Microsoft sign in error:', error)
      throw error
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise} - Sign out promise
   */
  async signOut() {
    if (!this.auth) {
      return Promise.resolve()
    }

    try {
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('logout')
      }
      return await this.auth.signOut()
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
    if (!this.firestore || !window.firebase || !window.firebase.firestore) {
      console.warn('Firestore is not available, skipping user document creation')
      return Promise.resolve()
    }

    try {
      // Check if user document already exists
      const userDoc = await this.firestore.collection('users').doc(user.uid).get()

      if (!userDoc.exists) {
        // Create new user document
        await this.firestore.collection('users').doc(user.uid).set({
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: window.firebase.firestore.FieldValue.serverTimestamp()
        })
      } else {
        // Update last login timestamp
        await this.firestore.collection('users').doc(user.uid).update({
          lastLogin: window.firebase.firestore.FieldValue.serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Create user document error:', error)
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
        resolve(this.currentUser)
      } else {
        const unsubscribe = EventBus.on('auth:initialized', user => {
          unsubscribe()
          resolve(user)
        })

        // Add a timeout to prevent waiting indefinitely
        setTimeout(() => {
          if (!this.initialized) {
            console.warn('Authentication initialization timed out')
            this.initialized = true
            this.initializationError = new Error('Authentication initialization timed out')
            unsubscribe()
            resolve(null)
            EventBus.emit('auth:error', this.initializationError)
          }
        }, 5000) // 5 seconds timeout
      }
    })
  }
}

// Singleton instance
export default new AuthService()
