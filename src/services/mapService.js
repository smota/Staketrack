import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { auth } from '@/firebase'
import { authService } from '@/services/authService'
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
    return !auth.currentUser || auth.currentUser.isAnonymous
  }

  /**
   * Get all maps for the current user
   * @returns {Promise<Array>} - Promise resolving to array of map objects
   */
  async getMaps() {
    try {
      if (this._isLocalMode()) {
        return localStorageService.getMaps()
      }

      const userId = auth.currentUser.uid
      const mapsRef = collection(db, 'users', userId, 'maps')
      const q = query(mapsRef)
      const snapshot = await getDocs(q)

      this.maps = snapshot.docs.map(doc => new Map({
        id: doc.id,
        ...doc.data(),
        userId
      }))

      return this.maps
    } catch (error) {
      console.error('Error getting maps:', error)
      throw error
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
      const mapRef = doc(db, 'users', userId, 'maps', mapId)
      const mapDoc = await getDoc(mapRef)

      if (!mapDoc.exists()) {
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
      const map = new Map({
        ...mapData,
        userId: auth.currentUser?.uid
      })

      // Always store in localStorage for better UX and offline support,
      // even if the user is logged in
      if (this._isLocalMode()) {
        // For anonymous users, just save to localStorage
        localStorageService.saveMap(map)
        return map
      } else {
        // For logged-in users, save to Firestore AND localStorage
        const userId = auth.currentUser.uid
        const mapsRef = collection(db, 'users', userId, 'maps')
        const docRef = await addDoc(mapsRef, map.toJSON())

        map._id = docRef.id
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
        const mapRef = doc(db, 'users', userId, 'maps', mapId)
        await updateDoc(mapRef, updatedMap.toJSON())
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
      const mapRef = doc(db, 'users', userId, 'maps', mapId)

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
        const mapRef = doc(db, 'users', userId, 'maps', mapId)
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
        await updateDoc(userRef, {
          currentMapId: mapId,
          lastActivity: new Date()
        })
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
