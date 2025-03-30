import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth } from '@/firebase'
import { db } from '@/firebase'
import { analytics } from '@/firebase'

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
      onAuthStateChanged(auth, user => {
        this.currentUser = user
        this.initialized = true

        if (user && analytics) {
          // analytics.setUserId(user.uid)
          // log analytics event if needed
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
      const result = await signInWithEmailAndPassword(auth, email, password)
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
      const result = await createUserWithEmailAndPassword(auth, email, password)

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
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

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
      return await signOut(auth)
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
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        })
      } else {
        // Update last login
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp()
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

  /**
   * Link an anonymous account to a credential (email or social provider)
   * @param {AuthCredential} credential - The credential to link
   * @returns {Promise<UserCredential>} Authentication promise
   */
  async linkAnonymousAccount(credential) {
    if (!auth.currentUser) {
      throw new Error('No authenticated user to upgrade')
    }

    if (!auth.currentUser.isAnonymous) {
      throw new Error('Current user is not anonymous')
    }

    try {
      return await auth.currentUser.linkWithCredential(credential)
    } catch (error) {
      console.error('Error linking anonymous account:', error)
      throw error
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
