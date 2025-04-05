import { collection, query, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, where, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { auth } from '@/firebase'
import { localStorageService } from './localStorageService'
import { Map } from '@/models/Map'

/**
 * Map Service - Handles operations related to stakeholder maps
 */
export class MapService {
  constructor() {
    this.maps = []
    this.currentMapId = null
  }

  /**
   * Check if using local storage mode
   * @private
   * @returns {boolean}
   */
  _isLocalMode() {
    // In development with emulators, we might want to force local mode for testing
    if (process.env.NODE_ENV === 'development' && !auth.currentUser) {
      console.log('Development mode with no user, using local storage')
      return true
    }

    // Normal check for anonymous or no user
    return !auth.currentUser || auth.currentUser.isAnonymous
  }

  /**
   * Get all maps for the current user
   * @returns {Promise<Array>} - Promise resolving to array of map objects
   */
  async getMaps() {
    try {
      console.log('MapService.getMaps() called')

      // Detailed authentication state reporting
      console.log('Current authentication state:', auth ? 'Auth initialized' : 'Auth not initialized')
      console.log('Current user:', auth.currentUser ? `Authenticated as ${auth.currentUser.uid}` : 'Not authenticated')
      console.log('Is anonymous user:', auth.currentUser?.isAnonymous ? 'Yes' : 'No')

      if (this._isLocalMode()) {
        console.log('Using local mode, returning from local storage')
        return localStorageService.getMaps()
      }

      // Check if user is authenticated and Firestore is available
      if (!auth.currentUser || !db) {
        console.warn('Firebase services not fully available, falling back to local storage')
        console.log('Auth state:', auth.currentUser ? 'Authenticated' : 'Not authenticated')
        console.log('Firestore available:', db ? 'Yes' : 'No')
        return localStorageService.getMaps()
      }

      try {
        const userId = auth.currentUser.uid
        console.log('Fetching maps for user ID:', userId)
        console.log('Using Firestore instance:', db ? 'Valid' : 'Invalid')

        // First try: Get all maps (without filter) to test basic Firestore access
        try {
          console.log('ATTEMPT A: Trying to retrieve all maps without filtering')
          const mapsRef = collection(db, 'maps')
          console.log('Created maps collection reference')

          const snapshot = await getDocs(mapsRef)
          console.log(`Retrieved ${snapshot.docs.length} total maps`)

          // Filter on the client side
          const userMaps = snapshot.docs
            .filter(doc => doc.data().userId === userId)
            .map(doc => new Map({
              id: doc.id,
              ...doc.data()
            }))

          console.log(`Found ${userMaps.length} maps belonging to current user`)

          if (userMaps.length > 0) {
            this.maps = userMaps
            return this.maps
          } else {
            console.log('No maps found for this user, will try filtered query')
          }
        } catch (allMapsError) {
          console.error('Error retrieving all maps:', allMapsError)
          console.error('Error code:', allMapsError.code)
          console.error('Error message:', allMapsError.message)
        }

        // Second try: Use the filtered query approach
        console.log('ATTEMPT B: Trying with userId filter')
        const mapsRef = collection(db, 'maps')
        console.log('Created maps collection reference')

        const q = query(mapsRef, where('userId', '==', userId))
        console.log('Created query with userId filter:', userId)

        // Add retry logic for Firestore query
        let attempts = 0
        const maxAttempts = 3
        let lastError = null

        while (attempts < maxAttempts) {
          try {
            console.log(`Attempt ${attempts + 1}/${maxAttempts} to execute Firestore query`)
            const snapshot = await getDocs(q)
            console.log(`Query successful, received ${snapshot.docs.length} documents`)

            this.maps = snapshot.docs.map(doc => new Map({
              id: doc.id,
              ...doc.data(),
              userId
            }))

            console.log('Processed maps data:', this.maps.length, 'maps')
            return this.maps
          } catch (retryError) {
            attempts++
            lastError = retryError
            console.error(`Attempt ${attempts} failed:`, retryError)

            // Detailed error reporting
            if (retryError.code) {
              console.error(`Error code: ${retryError.code}`)
            }
            if (retryError.name) {
              console.error(`Error name: ${retryError.name}`)
            }
            if (retryError.message) {
              console.error(`Error message: ${retryError.message}`)
            }

            if (attempts < maxAttempts) {
              // Wait before retrying (exponential backoff)
              const delayMs = Math.pow(2, attempts) * 500
              console.log(`Waiting ${delayMs}ms before retry`)
              await new Promise(resolve => setTimeout(resolve, delayMs))
            }
          }
        }

        // Third try: Use collection path inside the user document
        try {
          console.log('ATTEMPT C: Trying user-specific maps subcollection')
          const userMapsRef = collection(db, `users/${userId}/maps`)
          console.log('Created user maps subcollection reference')

          const snapshot = await getDocs(userMapsRef)
          console.log(`Retrieved ${snapshot.docs.length} maps from user subcollection`)

          if (snapshot.docs.length > 0) {
            this.maps = snapshot.docs.map(doc => new Map({
              id: doc.id,
              ...doc.data(),
              userId
            }))

            console.log('Processed maps data from subcollection:', this.maps.length, 'maps')
            return this.maps
          }
        } catch (subcollectionError) {
          console.error('Error retrieving maps from subcollection:', subcollectionError)
          console.error('Error code:', subcollectionError.code)
          console.error('Error message:', subcollectionError.message)
        }

        // If we get here, all attempts failed
        console.error('All Firestore query attempts failed, falling back to local storage. Last error:', lastError)

        // Try to get more information about the specific permission issue
        console.log('Current auth user details:')
        if (auth.currentUser) {
          console.log('  - UID:', auth.currentUser.uid)
          console.log('  - Email:', auth.currentUser.email || 'No email')
          console.log('  - Email verified:', auth.currentUser.emailVerified)
          console.log('  - Anonymous:', auth.currentUser.isAnonymous)
          console.log('  - Provider data:', JSON.stringify(auth.currentUser.providerData))
        } else {
          console.log('  - No current user')
        }

        return localStorageService.getMaps()
      } catch (firestoreError) {
        console.error('Firestore error, falling back to local storage:', firestoreError)

        // Log more details about the error
        if (firestoreError.code) {
          console.error('Error code:', firestoreError.code)
        }
        if (firestoreError.name) {
          console.error('Error name:', firestoreError.name)
        }
        if (firestoreError.message) {
          console.error('Error message:', firestoreError.message)
        }

        return localStorageService.getMaps()
      }
    } catch (error) {
      console.error('Error getting maps:', error)
      // Return empty array as fallback to prevent UI errors
      return []
    }
  }

  /**
   * Get a single map by ID
   * @param {string} mapId - Map ID
   * @returns {Promise<Object>} - Promise resolving to map object
   */
  async getMap(mapId) {
    try {
      if (this._isLocalMode()) {
        return localStorageService.getMap(mapId)
      }

      const userId = auth.currentUser.uid
      const mapRef = doc(db, 'maps', mapId)
      const mapDoc = await getDoc(mapRef)

      if (!mapDoc.exists()) {
        return null
      }

      // Ensure the map belongs to the current user
      const mapData = mapDoc.data()
      if (mapData.userId !== userId) {
        console.error('Map does not belong to current user')
        return null
      }

      return new Map({
        id: mapDoc.id,
        ...mapDoc.data(),
        userId
      })
    } catch (error) {
      console.error('Error getting map:', error)
      throw error
    }
  }

  /**
   * Get the current map
   * @returns {Promise<Object>} - Promise resolving to current map object
   */
  async getCurrentMap() {
    const mapId = this.getCurrentMapId()
    if (!mapId) {
      return null
    }
    return this.getMap(mapId)
  }

  /**
   * Create a new map
   * @param {Object} mapData - Map data
   * @returns {Promise<Object>} - Promise resolving to created map object
   */
  async createMap(mapData) {
    try {
      console.log('Creating map with data:', mapData)
      console.log('Current auth state:', auth.currentUser)

      const map = new Map({
        ...mapData,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stakeholderCount: 0
      })

      // Always store in localStorage for better UX and offline support,
      // even if the user is logged in
      if (this._isLocalMode()) {
        console.log('Using local mode, saving to localStorage')
        // For anonymous users, just save to localStorage
        localStorageService.saveMap(map)
        return map
      } else {
        console.log('Using Firestore mode, saving to database')
        // For logged-in users, save to Firestore AND localStorage
        const userId = auth.currentUser.uid
        console.log('User ID for map creation:', userId)

        const mapsRef = collection(db, 'maps')
        const mapData = map.toJSON()

        // Don't include ID in Firestore document data
        const { id, ...firestoreData } = mapData
        console.log('Map data being sent to Firestore:', firestoreData)

        const docRef = await addDoc(mapsRef, firestoreData)

        map._id = docRef.id
        console.log('Map created with ID:', docRef.id)

        // Save to localStorage for faster loading in future
        localStorageService.saveMap(map)
        return map
      }
    } catch (error) {
      console.error('Error creating map:', error)
      throw error
    }
  }

  /**
   * Update a map
   * @param {string} mapId - Map ID
   * @param {Object} mapData - Updated map data
   * @returns {Promise<Object>} - Promise resolving to updated map object
   */
  async updateMap(mapId, mapData) {
    try {
      const existingMap = await this.getMap(mapId)
      if (!existingMap) {
        throw new Error('Map not found')
      }

      const updatedMap = new Map({
        ...existingMap.toJSON(),
        ...mapData,
        id: mapId,
        updatedAt: new Date()
      })

      // Always update localStorage for faster access
      localStorageService.saveMap(updatedMap)

      if (!this._isLocalMode()) {
        // If user is logged in, update Firestore too
        const userId = auth.currentUser.uid
        const mapRef = doc(db, 'maps', mapId)

        // Get the map data but remove the id field
        const mapData = updatedMap.toJSON()
        const { id, ...firestoreData } = mapData

        await updateDoc(mapRef, firestoreData)
      }

      return updatedMap
    } catch (error) {
      console.error('Error updating map:', error)
      throw error
    }
  }

  /**
   * Delete a map
   * @param {string} mapId - Map ID
   * @returns {Promise<void>}
   */
  async deleteMap(mapId) {
    try {
      if (this._isLocalMode()) {
        localStorageService.deleteMap(mapId)
        return
      }

      const userId = auth.currentUser.uid
      const mapRef = doc(db, 'maps', mapId)

      // Verify the map belongs to the current user before deleting
      const mapDoc = await getDoc(mapRef)
      if (!mapDoc.exists()) {
        throw new Error('Map not found')
      }

      if (mapDoc.data().userId !== userId) {
        throw new Error('You do not have permission to delete this map')
      }

      await deleteDoc(mapRef)
    } catch (error) {
      console.error('Error deleting map:', error)
      throw error
    }
  }

  /**
   * Update stakeholder count for a map
   * @param {string} mapId - Map ID
   * @param {number} count - New stakeholder count
   * @returns {Promise<void>}
   */
  async updateStakeholderCount(mapId, count) {
    try {
      const map = await this.getMap(mapId)
      if (!map) {
        throw new Error('Map not found')
      }

      map.stakeholderCount = count
      map.updatedAt = new Date()

      // Always update localStorage
      localStorageService.saveMap(map)

      if (!this._isLocalMode()) {
        // If user is logged in, update Firestore too
        const userId = auth.currentUser.uid
        const mapRef = doc(db, 'maps', mapId)
        await updateDoc(mapRef, {
          stakeholderCount: count,
          updatedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error updating stakeholder count:', error)
      throw error
    }
  }

  /**
   * Set the current map ID
   * @param {string} mapId - Map ID
   * @returns {Promise<void>}
   */
  async setCurrentMapId(mapId) {
    try {
      this.currentMapId = mapId

      // Always save to localStorage for offline access
      localStorageService.setCurrentMapId(mapId)

      // If user is logged in, update their preferences in Firestore
      if (!this._isLocalMode() && auth.currentUser) {
        const userId = auth.currentUser.uid
        const userRef = doc(db, 'users', userId)

        // Check if user document exists
        const userDoc = await getDoc(userRef)

        if (!userDoc.exists()) {
          // Create the user document if it doesn't exist
          await setDoc(userRef, {
            email: auth.currentUser.email || '',
            displayName: auth.currentUser.displayName || '',
            photoURL: auth.currentUser.photoURL || '',
            currentMapId: mapId,
            createdAt: Timestamp.fromDate(new Date()),
            lastLogin: Timestamp.fromDate(new Date()),
            lastActivity: Timestamp.fromDate(new Date())
          })
        } else {
          // Update existing user document
          await updateDoc(userRef, {
            currentMapId: mapId,
            lastActivity: Timestamp.fromDate(new Date())
          })
        }
      }

      return true
    } catch (error) {
      console.error('Error setting current map ID:', error)
      // Still set locally even if Firebase update fails
      return true
    }
  }

  /**
   * Get the current map ID
   * @returns {string|null} Current map ID or null if not set
   */
  getCurrentMapId() {
    if (this._isLocalMode()) {
      return localStorageService.getCurrentMapId()
    }
    return this.currentMapId
  }
}

// Export singleton instance
export const mapService = new MapService()
