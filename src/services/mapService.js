import firebase from 'firebase/app'
import 'firebase/firestore'
import { authService } from '@/services/authService'

/**
 * Map Service - Handles operations related to stakeholder maps
 */
class MapService {
  constructor() {
    this.maps = []
    this.currentMapId = null
  }

  /**
   * Get all maps for the current user
   * @returns {Promise<Array>} - Promise resolving to array of map objects
   */
  async getMaps() {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error('User not authenticated')
      }

      const userId = authService.getCurrentUser().uid
      const db = firebase.firestore()

      const mapsRef = db.collection('users').doc(userId).collection('maps')
      const snapshot = await mapsRef.get()

      this.maps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastUpdated: doc.data().lastUpdated?.toDate() || null
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
      if (!authService.isAuthenticated()) {
        throw new Error('User not authenticated')
      }

      const userId = authService.getCurrentUser().uid
      const db = firebase.firestore()

      const mapRef = db.collection('users').doc(userId).collection('maps').doc(mapId)
      const doc = await mapRef.get()

      if (!doc.exists) {
        throw new Error('Map not found')
      }

      const mapData = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastUpdated: doc.data().lastUpdated?.toDate() || null
      }

      this.currentMapId = mapId
      return mapData
    } catch (error) {
      console.error('Error getting map:', error)
      throw error
    }
  }

  /**
   * Create a new map
   * @param {Object} mapData - Map data
   * @returns {Promise<Object>} - Promise resolving to created map object
   */
  async createMap(mapData) {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error('User not authenticated')
      }

      const userId = authService.getCurrentUser().uid
      const db = firebase.firestore()

      const mapRef = db.collection('users').doc(userId).collection('maps')

      const newMapData = {
        name: mapData.name,
        description: mapData.description || '',
        userId: userId,
        stakeholderCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }

      const docRef = await mapRef.add(newMapData)

      // Get the created map with its ID
      const createdMap = {
        id: docRef.id,
        ...newMapData,
        createdAt: new Date(),
        lastUpdated: new Date()
      }

      // Add to local cache
      this.maps.push(createdMap)
      this.currentMapId = docRef.id

      return createdMap
    } catch (error) {
      console.error('Error creating map:', error)
      throw error
    }
  }

  /**
   * Update an existing map
   * @param {string} mapId - Map ID
   * @param {Object} mapData - Map data to update
   * @returns {Promise<Object>} - Promise resolving to updated map object
   */
  async updateMap(mapId, mapData) {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error('User not authenticated')
      }

      const userId = authService.getCurrentUser().uid
      const db = firebase.firestore()

      const mapRef = db.collection('users').doc(userId).collection('maps').doc(mapId)

      const updateData = {
        name: mapData.name,
        description: mapData.description || '',
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }

      await mapRef.update(updateData)

      // Update local cache
      const index = this.maps.findIndex(m => m.id === mapId)
      if (index !== -1) {
        this.maps[index] = {
          ...this.maps[index],
          ...updateData,
          lastUpdated: new Date()
        }
      }

      return {
        id: mapId,
        ...updateData,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error updating map:', error)
      throw error
    }
  }

  /**
   * Delete a map and all its stakeholders
   * @param {string} mapId - Map ID
   * @returns {Promise<void>}
   */
  async deleteMap(mapId) {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error('User not authenticated')
      }

      const userId = authService.getCurrentUser().uid
      const db = firebase.firestore()

      // First, remove all stakeholders and related data
      // This would be better with a Firestore Function, but for simplicity:
      const stakeholdersRef = db.collection('users').doc(userId)
        .collection('maps').doc(mapId).collection('stakeholders')

      const stakeholders = await stakeholdersRef.get()

      // Batch delete all stakeholders
      if (!stakeholders.empty) {
        const batch = db.batch()
        stakeholders.docs.forEach(doc => {
          batch.delete(doc.ref)
        })
        await batch.commit()
      }

      // Delete the map itself
      await db.collection('users').doc(userId).collection('maps').doc(mapId).delete()

      // Update local cache
      this.maps = this.maps.filter(m => m.id !== mapId)
      if (this.currentMapId === mapId) {
        this.currentMapId = null
      }
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
      if (!authService.isAuthenticated()) {
        throw new Error('User not authenticated')
      }

      const userId = authService.getCurrentUser().uid
      const db = firebase.firestore()

      const mapRef = db.collection('users').doc(userId).collection('maps').doc(mapId)

      await mapRef.update({
        stakeholderCount: count,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      })

      // Update local cache
      const index = this.maps.findIndex(m => m.id === mapId)
      if (index !== -1) {
        this.maps[index].stakeholderCount = count
        this.maps[index].lastUpdated = new Date()
      }
    } catch (error) {
      console.error('Error updating stakeholder count:', error)
      throw error
    }
  }

  /**
   * Set the current map ID
   * @param {string} mapId - Map ID
   */
  setCurrentMapId(mapId) {
    this.currentMapId = mapId
  }

  /**
   * Get the current map ID
   * @returns {string|null} - Current map ID
   */
  getCurrentMapId() {
    return this.currentMapId
  }
}

// Export singleton instance
export const mapService = new MapService()
