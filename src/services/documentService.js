/**
 * Document Service
 * Manages stakeholder-related documents and notes using Firebase or local storage
 */

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'
import { authService } from '@/services/authService'
import { localStorageService } from '@/services/localStorageService'
import { v4 as uuidv4 } from 'uuid'

class DocumentService {
  /**
   * Get documents for a stakeholder
   * @param {string} mapId - Stakeholder map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Array>} - List of documents
   */
  async getDocuments(mapId, stakeholderId) {
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
          .collection('documents')
          .orderBy('date', 'desc')
          .get()

        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } else {
        // Get from local storage
        const documents = localStorageService.getDocuments(mapId, stakeholderId)
        return documents || []
      }
    } catch (error) {
      console.error('Error getting documents:', error)
      throw error
    }
  }

  /**
   * Add a new document or note
   * @param {string} mapId - Stakeholder map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {Object} document - Document data
   * @returns {Promise<Object>} - Added document with ID
   */
  async addDocument(mapId, stakeholderId, document) {
    try {
      const newDocument = {
        ...document,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }

      let fileUrl = null

      // If this is a file upload (not a note), upload the file to storage first
      if (document.type !== 'note' && document.file) {
        if (authService.isAuthenticated()) {
          const userId = authService.getCurrentUser().uid
          const fileRef = firebase.storage()
            .ref()
            .child(`users/${userId}/maps/${mapId}/stakeholders/${stakeholderId}/documents/${newDocument.id}`)

          await fileRef.put(document.file)
          fileUrl = await fileRef.getDownloadURL()
        } else {
          // Store file in local storage (simplified - in reality we'd need IndexedDB for files)
          fileUrl = 'local://file'
        }

        // Replace the file object with the URL for storage
        delete newDocument.file
        newDocument.fileUrl = fileUrl
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
          .collection('documents')
          .doc(newDocument.id)
          .set(newDocument)
      } else {
        // Add to local storage
        localStorageService.addDocument(mapId, stakeholderId, newDocument)
      }

      return newDocument
    } catch (error) {
      console.error('Error adding document:', error)
      throw error
    }
  }

  /**
   * Update an existing document or note
   * @param {string} mapId - Stakeholder map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {string} documentId - Document ID
   * @param {Object} documentData - Updated document data
   * @returns {Promise<void>}
   */
  async updateDocument(mapId, stakeholderId, documentId, documentData) {
    try {
      const updatedDocument = {
        ...documentData,
        updatedAt: new Date().toISOString()
      }

      // If there's a new file, upload it
      if (documentData.type !== 'note' && documentData.file) {
        if (authService.isAuthenticated()) {
          const userId = authService.getCurrentUser().uid
          const fileRef = firebase.storage()
            .ref()
            .child(`users/${userId}/maps/${mapId}/stakeholders/${stakeholderId}/documents/${documentId}`)

          await fileRef.put(documentData.file)
          updatedDocument.fileUrl = await fileRef.getDownloadURL()
        } else {
          updatedDocument.fileUrl = 'local://file'
        }

        // Remove the file object from the document data
        delete updatedDocument.file
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
          .collection('documents')
          .doc(documentId)
          .update(updatedDocument)
      } else {
        // Update in local storage
        localStorageService.updateDocument(mapId, stakeholderId, documentId, updatedDocument)
      }
    } catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  }

  /**
   * Delete a document
   * @param {string} mapId - Stakeholder map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {string} documentId - Document ID
   * @returns {Promise<void>}
   */
  async deleteDocument(mapId, stakeholderId, documentId) {
    try {
      // If authenticated, also delete the file from storage if it exists
      if (authService.isAuthenticated()) {
        try {
          const userId = authService.getCurrentUser().uid
          const fileRef = firebase.storage()
            .ref()
            .child(`users/${userId}/maps/${mapId}/stakeholders/${stakeholderId}/documents/${documentId}`)

          await fileRef.delete()
        } catch (storageError) {
          // Ignore errors if the file doesn't exist
          console.log('No file to delete or error deleting file:', storageError)
        }

        // Delete from Firestore
        const userId = authService.getCurrentUser().uid
        await firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('maps')
          .doc(mapId)
          .collection('stakeholders')
          .doc(stakeholderId)
          .collection('documents')
          .doc(documentId)
          .delete()
      } else {
        // Delete from local storage
        localStorageService.deleteDocument(mapId, stakeholderId, documentId)
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }

  /**
   * Get download URL for a document
   * @param {string} mapId - Stakeholder map ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {string} documentId - Document ID
   * @returns {Promise<string>} - Download URL
   */
  async getDocumentUrl(mapId, stakeholderId, documentId) {
    try {
      if (authService.isAuthenticated()) {
        // Get document data from Firestore
        const userId = authService.getCurrentUser().uid
        const doc = await firebase.firestore()
          .collection('users')
          .doc(userId)
          .collection('maps')
          .doc(mapId)
          .collection('stakeholders')
          .doc(stakeholderId)
          .collection('documents')
          .doc(documentId)
          .get()

        // Return the stored URL
        if (doc.exists && doc.data().fileUrl) {
          return doc.data().fileUrl
        }

        // If URL not in document, try to get it from storage
        const fileRef = firebase.storage()
          .ref()
          .child(`users/${userId}/maps/${mapId}/stakeholders/${stakeholderId}/documents/${documentId}`)

        return await fileRef.getDownloadURL()
      } else {
        // Get from local storage - in real implementation, we'd need to use
        // IndexedDB or similar for file storage
        const documents = localStorageService.getDocuments(mapId, stakeholderId) || []
        const document = documents.find(doc => doc.id === documentId)

        if (document && document.fileUrl) {
          return document.fileUrl
        }

        throw new Error('Document URL not found in local storage')
      }
    } catch (error) {
      console.error('Error getting document URL:', error)
      throw error
    }
  }
}

export const documentService = new DocumentService()
