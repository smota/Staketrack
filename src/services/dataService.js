/**
 * Data Service
 * Handles data operations like import, export, and backup
 */

import firebase from 'firebase/app'
import 'firebase/firestore'
import { authService } from '@/services/authService'
import { localStorageService } from '@/services/localStorageService'
import { mapService } from '@/services/mapService'
import { stakeholderService } from '@/services/stakeholderService'

class DataService {
  /**
   * Export data for backup or transfer
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Exported data
   */
  async exportData(options = {}) {
    try {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        maps: []
      }

      // Get all maps
      const maps = await mapService.getMaps()

      // For each map, get stakeholders if requested
      for (const map of maps) {
        const mapData = {
          id: map.id,
          name: map.name,
          description: map.description,
          createdAt: map.createdAt,
          updatedAt: map.updatedAt,
          viewSettings: map.viewSettings
        }

        // Add stakeholders if requested
        if (options.includeStakeholders) {
          const stakeholders = await stakeholderService.getStakeholders(map.id)
          mapData.stakeholders = stakeholders

          // Add interactions/documents if requested
          if (options.includeInteractions || options.includeDocuments) {
            mapData.stakeholders = await Promise.all(stakeholders.map(async (stakeholder) => {
              const stakeholderData = { ...stakeholder }

              if (options.includeInteractions) {
                // This assumes an interactionService exists
                const interactions = await this._getInteractions(map.id, stakeholder.id)
                stakeholderData.interactions = interactions
              }

              if (options.includeDocuments) {
                // This assumes a documentService exists
                const documents = await this._getDocuments(map.id, stakeholder.id)
                stakeholderData.documents = documents
              }

              return stakeholderData
            }))
          }
        }

        exportData.maps.push(mapData)
      }

      return exportData
    } catch (error) {
      console.error('Error exporting data:', error)
      throw error
    }
  }

  /**
   * Import data from a previously exported file
   * @param {Object} options - Import options
   * @returns {Promise<void>}
   */
  async importData(options = {}) {
    try {
      const { data, conflictResolution = 'merge' } = options

      if (!data || !data.maps || !Array.isArray(data.maps)) {
        throw new Error('Invalid import data format')
      }

      // Import maps
      for (const mapData of data.maps) {
        await this._importMap(mapData, conflictResolution)
      }
    } catch (error) {
      console.error('Error importing data:', error)
      throw error
    }
  }

  /**
   * Clear all cloud data for the current user
   * @returns {Promise<void>}
   */
  async clearCloudData() {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error('User not authenticated')
      }

      const userId = authService.getCurrentUser().uid

      // Get all maps
      const maps = await mapService.getMaps()

      // Delete each map and its contents
      for (const map of maps) {
        // First delete subcollections (stakeholders, interactions, documents)
        await this._deleteMapContents(userId, map.id)

        // Then delete the map document
        await firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('maps')
          .doc(map.id)
          .delete()
      }
    } catch (error) {
      console.error('Error clearing cloud data:', error)
      throw error
    }
  }

  /**
   * Helper method to delete map contents (stakeholders, interactions, documents)
   * @private
   * @param {string} userId - User ID
   * @param {string} mapId - Map ID
   * @returns {Promise<void>}
   */
  async _deleteMapContents(userId, mapId) {
    try {
      // Get all stakeholders
      const stakeholdersSnapshot = await firebase.firestore()
        .collection('users')
        .doc(userId)
        .collection('maps')
        .doc(mapId)
        .collection('stakeholders')
        .get()

      // For each stakeholder, delete interactions and documents
      for (const stakeholderDoc of stakeholdersSnapshot.docs) {
        const stakeholderId = stakeholderDoc.id

        // Delete interactions
        await this._deleteSubcollection(
          `users/${userId}/maps/${mapId}/stakeholders/${stakeholderId}/interactions`
        )

        // Delete documents
        await this._deleteSubcollection(
          `users/${userId}/maps/${mapId}/stakeholders/${stakeholderId}/documents`
        )

        // Delete stakeholder
        await stakeholderDoc.ref.delete()
      }
    } catch (error) {
      console.error('Error deleting map contents:', error)
      throw error
    }
  }

  /**
   * Helper method to delete a subcollection
   * @private
   * @param {string} collectionPath - Path to the collection
   * @returns {Promise<void>}
   */
  async _deleteSubcollection(collectionPath) {
    try {
      const batch = firebase.firestore().batch()
      const snapshot = await firebase.firestore().collection(collectionPath).get()

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      if (snapshot.docs.length > 0) {
        await batch.commit()
      }
    } catch (error) {
      console.error(`Error deleting subcollection at ${collectionPath}:`, error)
      throw error
    }
  }

  /**
   * Import a map
   * @private
   * @param {Object} mapData - Map data to import
   * @param {string} conflictResolution - How to handle conflicts (keep, replace, merge)
   * @returns {Promise<Object>} - Imported map
   */
  async _importMap(mapData, conflictResolution) {
    try {
      // Check if map already exists
      const existingMaps = await mapService.getMaps()
      const existingMap = existingMaps.find(m => m.id === mapData.id)

      let map

      if (existingMap && conflictResolution === 'keep') {
        // Keep existing map
        map = existingMap
      } else if (!existingMap || conflictResolution === 'replace') {
        // Create new map or replace existing
        const { stakeholders, ...mapOnly } = mapData
        map = await mapService.saveMap(mapOnly)

        // Import stakeholders if present
        if (stakeholders && Array.isArray(stakeholders)) {
          for (const stakeholderData of stakeholders) {
            const { interactions, documents, ...stakeholderOnly } = stakeholderData
            const stakeholder = await stakeholderService.saveStakeholder(map.id, stakeholderOnly)

            // Import interactions if present
            if (interactions && Array.isArray(interactions)) {
              await this._importInteractions(map.id, stakeholder.id, interactions)
            }

            // Import documents if present
            if (documents && Array.isArray(documents)) {
              await this._importDocuments(map.id, stakeholder.id, documents)
            }
          }
        }
      } else if (conflictResolution === 'merge') {
        // Merge with existing map
        const { stakeholders, ...mapOnly } = mapData
        map = await mapService.saveMap({ ...existingMap, ...mapOnly })

        // Import stakeholders if present
        if (stakeholders && Array.isArray(stakeholders)) {
          // Get existing stakeholders
          const existingStakeholders = await stakeholderService.getStakeholders(map.id)

          for (const stakeholderData of stakeholders) {
            const { interactions, documents, ...stakeholderOnly } = stakeholderData

            // Check if stakeholder already exists
            const existingStakeholder = existingStakeholders.find(s => s.id === stakeholderData.id)

            let stakeholder

            if (existingStakeholder) {
              // Merge with existing stakeholder
              stakeholder = await stakeholderService.saveStakeholder(
                map.id,
                { ...existingStakeholder, ...stakeholderOnly }
              )
            } else {
              // Create new stakeholder
              stakeholder = await stakeholderService.saveStakeholder(map.id, stakeholderOnly)
            }

            // Import interactions if present
            if (interactions && Array.isArray(interactions)) {
              await this._importInteractions(map.id, stakeholder.id, interactions)
            }

            // Import documents if present
            if (documents && Array.isArray(documents)) {
              await this._importDocuments(map.id, stakeholder.id, documents)
            }
          }
        }
      }

      return map
    } catch (error) {
      console.error('Error importing map:', error)
      throw error
    }
  }

  /**
   * Import interactions for a stakeholder
   * @private
   * @param {string} mapId - Map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {Array} interactions - Interactions to import
   * @returns {Promise<void>}
   */
  async _importInteractions(mapId, stakeholderId, interactions) {
    try {
      // This method would use interactionService to import interactions
      // Simplified implementation for now
      if (authService.isAuthenticated()) {
        const userId = authService.getCurrentUser().uid
        const batch = firebase.firestore().batch()

        interactions.forEach(interaction => {
          const ref = firebase.firestore()
            .collection('users')
            .doc(userId)
            .collection('maps')
            .doc(mapId)
            .collection('stakeholders')
            .doc(stakeholderId)
            .collection('interactions')
            .doc(interaction.id)

          batch.set(ref, interaction)
        })

        await batch.commit()
      } else {
        // Store in local storage
        localStorageService.setInteractions(mapId, stakeholderId, interactions)
      }
    } catch (error) {
      console.error('Error importing interactions:', error)
      throw error
    }
  }

  /**
   * Import documents for a stakeholder
   * @private
   * @param {string} mapId - Map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {Array} documents - Documents to import
   * @returns {Promise<void>}
   */
  async _importDocuments(mapId, stakeholderId, documents) {
    try {
      // This method would use documentService to import documents
      // Simplified implementation for now
      if (authService.isAuthenticated()) {
        const userId = authService.getCurrentUser().uid
        const batch = firebase.firestore().batch()

        documents.forEach(document => {
          const ref = firebase.firestore()
            .collection('users')
            .doc(userId)
            .collection('maps')
            .doc(mapId)
            .collection('stakeholders')
            .doc(stakeholderId)
            .collection('documents')
            .doc(document.id)

          batch.set(ref, document)
        })

        await batch.commit()
      } else {
        // Store in local storage
        localStorageService.setDocuments(mapId, stakeholderId, documents)
      }
    } catch (error) {
      console.error('Error importing documents:', error)
      throw error
    }
  }

  /**
   * Helper to get interactions for a stakeholder
   * @private
   * @param {string} mapId - Map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Array>} - List of interactions
   */
  async _getInteractions(mapId, stakeholderId) {
    try {
      // This would normally use interactionService
      // Simplified implementation for now
      if (authService.isAuthenticated()) {
        const userId = authService.getCurrentUser().uid
        const snapshot = await firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('maps')
          .doc(mapId)
          .collection('stakeholders')
          .doc(stakeholderId)
          .collection('interactions')
          .get()

        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } else {
        return localStorageService.getInteractions(mapId, stakeholderId) || []
      }
    } catch (error) {
      console.error('Error getting interactions:', error)
      return []
    }
  }

  /**
   * Helper to get documents for a stakeholder
   * @private
   * @param {string} mapId - Map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Array>} - List of documents
   */
  async _getDocuments(mapId, stakeholderId) {
    try {
      // This would normally use documentService
      // Simplified implementation for now
      if (authService.isAuthenticated()) {
        const userId = authService.getCurrentUser().uid
        const snapshot = await firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('maps')
          .doc(mapId)
          .collection('stakeholders')
          .doc(stakeholderId)
          .collection('documents')
          .get()

        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } else {
        return localStorageService.getDocuments(mapId, stakeholderId) || []
      }
    } catch (error) {
      console.error('Error getting documents:', error)
      return []
    }
  }
}

export const dataService = new DataService()
