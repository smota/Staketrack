/**
 * Interaction Service
 * Manages stakeholder interactions using Firebase or local storage
 */

import firebase from 'firebase/app'
import 'firebase/firestore'
import { authService } from '@/services/authService'
import { localStorageService } from '@/services/localStorageService'
import { v4 as uuidv4 } from 'uuid'

class InteractionService {
  /**
   * Get interactions for a stakeholder
   * @param {string} mapId - Stakeholder map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Array>} - List of interactions
   */
  async getInteractions(mapId, stakeholderId) {
    try {
      if (authService.isAuthenticated()) {
        // Get from Firebase
        const userId = authService.getCurrentUser().uid
        const snapshot = await firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('maps')
          .doc(mapId)
          .collection('stakeholders')
          .doc(stakeholderId)
          .collection('interactions')
          .orderBy('date', 'desc')
          .get()

        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } else {
        // Get from local storage
        const interactions = localStorageService.getInteractions(mapId, stakeholderId)
        return interactions || []
      }
    } catch (error) {
      console.error('Error getting interactions:', error)
      throw error
    }
  }

  /**
   * Add a new interaction
   * @param {string} mapId - Stakeholder map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {Object} interaction - Interaction data
   * @returns {Promise<Object>} - Added interaction with ID
   */
  async addInteraction(mapId, stakeholderId, interaction) {
    try {
      const newInteraction = {
        ...interaction,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }

      if (authService.isAuthenticated()) {
        // Add to Firebase
        const userId = authService.getCurrentUser().uid
        await firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('maps')
          .doc(mapId)
          .collection('stakeholders')
          .doc(stakeholderId)
          .collection('interactions')
          .doc(newInteraction.id)
          .set(newInteraction)
      } else {
        // Add to local storage
        localStorageService.addInteraction(mapId, stakeholderId, newInteraction)
      }

      return newInteraction
    } catch (error) {
      console.error('Error adding interaction:', error)
      throw error
    }
  }

  /**
   * Update an existing interaction
   * @param {string} mapId - Stakeholder map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {string} interactionId - Interaction ID
   * @param {Object} interactionData - Updated interaction data
   * @returns {Promise<void>}
   */
  async updateInteraction(mapId, stakeholderId, interactionId, interactionData) {
    try {
      const updatedInteraction = {
        ...interactionData,
        updatedAt: new Date().toISOString()
      }

      if (authService.isAuthenticated()) {
        // Update in Firebase
        const userId = authService.getCurrentUser().uid
        await firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('maps')
          .doc(mapId)
          .collection('stakeholders')
          .doc(stakeholderId)
          .collection('interactions')
          .doc(interactionId)
          .update(updatedInteraction)
      } else {
        // Update in local storage
        localStorageService.updateInteraction(mapId, stakeholderId, interactionId, updatedInteraction)
      }
    } catch (error) {
      console.error('Error updating interaction:', error)
      throw error
    }
  }

  /**
   * Delete an interaction
   * @param {string} mapId - Stakeholder map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {string} interactionId - Interaction ID
   * @returns {Promise<void>}
   */
  async deleteInteraction(mapId, stakeholderId, interactionId) {
    try {
      if (authService.isAuthenticated()) {
        // Delete from Firebase
        const userId = authService.getCurrentUser().uid
        await firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('maps')
          .doc(mapId)
          .collection('stakeholders')
          .doc(stakeholderId)
          .collection('interactions')
          .doc(interactionId)
          .delete()
      } else {
        // Delete from local storage
        localStorageService.deleteInteraction(mapId, stakeholderId, interactionId)
      }
    } catch (error) {
      console.error('Error deleting interaction:', error)
      throw error
    }
  }
}

export const interactionService = new InteractionService()
