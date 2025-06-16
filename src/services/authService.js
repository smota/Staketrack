import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore'
import { auth } from '@/firebase'
import { db } from '@/firebase'
import { analytics } from '@/firebase'
import { localStorageService } from './localStorageService'
import { StakeholderMap } from '@/models/StakeholderMap'
import { Stakeholder } from '@/models/Stakeholder'

/**
 * Authentication Service - Handles user authentication operations
 */
class AuthService {
  constructor() {
    this.currentUser = null
    this.isLocalAnonymous = false
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
    if (localStorageService.isAnonymousSessionActive()) {
      this.isLocalAnonymous = true
    }

    try {
      onAuthStateChanged(auth, user => {
        this.currentUser = user
        if (user) {
          this.isLocalAnonymous = false
          localStorageService.setAnonymousSession(false)
        }
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
    if (this.isLocalAnonymous) {
      return { uid: 'anonymous', isAnonymous: true }
    }
    return this.currentUser
  }

  /**
   * Check if a user is authenticated
   * @returns {boolean} - True if user is authenticated, false otherwise
   */
  isAuthenticated() {
    return !!this.currentUser || this.isLocalAnonymous
  }

  /**
   * Start a local anonymous session.
   */
  startLocalAnonymousSession() {
    if (this.currentUser) {
      console.warn('Cannot start local anonymous session when a user is logged in.')
      return
    }
    this.isLocalAnonymous = true
    localStorageService.setAnonymousSession(true)
  }

  /**
   * End a local anonymous session.
   */
  endLocalAnonymousSession() {
    this.isLocalAnonymous = false
    localStorageService.setAnonymousSession(false)
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
      this.endLocalAnonymousSession()
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
        // Create new user document with all required fields
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          lastActivity: serverTimestamp(),
          settings: {
            theme: 'light',
            notifications: true
          }
        })
      } else {
        // Update last login
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
          lastActivity: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Error creating/updating user document:', error)
      // Don't throw error to prevent sign-in failure
      // Just log the error and continue
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

  /**
   * Migrates data from local storage to Firestore after a user logs in.
   * This is intended to move data created during an anonymous session to the permanent user account.
   */
  async migrateLocalDataToFirestore() {
    if (!this.currentUser || this.currentUser.isAnonymous) {
      console.log('Migration skipped: User not logged in or is anonymous.')
      return
    }

    const userId = this.currentUser.uid
    console.log(`Starting data migration for user ${userId}`)

    const localMapsData = localStorageService.getMaps()
    if (!localMapsData || localMapsData.length === 0) {
      console.log('No local maps to migrate.')
      return
    }

    const localMaps = localMapsData.map(data => new StakeholderMap(data))
    console.log(`Found ${localMaps.length} local maps to migrate.`)

    for (const localMap of localMaps) {
      try {
        const mapId = localMap.id
        console.log(`Migrating map ${mapId}`)

        const mapDocRef = doc(db, 'stakeholderMaps', mapId)
        const mapData = {
          ...localMap.toFirestore(),
          createdBy: userId,
          updatedAt: serverTimestamp()
        }

        await setDoc(mapDocRef, mapData)

        const localStakeholdersData = localStorageService.getStakeholders(mapId)
        if (localStakeholdersData && localStakeholdersData.length > 0) {
          const localStakeholders = localStakeholdersData.map(data => new Stakeholder(data))
          console.log(`Migrating ${localStakeholders.length} stakeholders for map ${mapId}`)
          const stakeholdersCollectionRef = collection(mapDocRef, 'stakeholders')

          for (const localStakeholder of localStakeholders) {
            const stakeholderId = localStakeholder.id
            const stakeholderDocRef = doc(stakeholdersCollectionRef, stakeholderId)
            const stakeholderData = {
              ...localStakeholder.toFirestore(),
              updatedAt: serverTimestamp()
            }
            await setDoc(stakeholderDocRef, stakeholderData)
          }
        }

        // If migration is successful, remove from local storage
        localStorageService.deleteMap(mapId)
        localStorageService.deleteStakeholders(mapId)
        console.log(`Successfully migrated and removed local map ${mapId}`)
      } catch (error) {
        console.error(`Failed to migrate map ${localMap.id}:`, error)
      }
    }
    console.log('Data migration finished.')
  }
}

const authService = new AuthService()

export { authService, AuthService }
