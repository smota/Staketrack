import { firestore } from '../../../firebase/firebaseConfig.js';
import { EventBus } from '../utils/eventBus.js';

/**
 * Firebase Service - Handles direct Firestore operations
 */
class FirebaseService {
  /**
   * Initialize the Firebase service
   */
  constructor() {
    this.db = firestore;
  }
  
  /**
   * Get a user document
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User document or null if not found
   */
  async getUser(userId) {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }
  
  /**
   * Update user settings
   * @param {string} userId - User ID
   * @param {Object} settings - Settings to update
   * @returns {Promise<void>}
   */
  async updateUserSettings(userId, settings) {
    try {
      await this.db.collection('users').doc(userId).update({
        settings: settings,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      EventBus.emit('user:settings-updated', settings);
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }
  
  /**
   * Get maps for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of map documents
   */
  async getUserMaps(userId) {
    try {
      const snapshot = await this.db.collection('maps')
        .where('ownerId', '==', userId)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user maps:', error);
      throw error;
    }
  }
  
  /**
   * Get stakeholders for a map
   * @param {string} mapId - Map ID
   * @returns {Promise<Array>} - Array of stakeholder documents
   */
  async getMapStakeholders(mapId) {
    try {
      const snapshot = await this.db.collection('stakeholders')
        .where('mapId', '==', mapId)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting map stakeholders:', error);
      throw error;
    }
  }
  
  /**
   * Create a new map
   * @param {Object} mapData - Map data
   * @returns {Promise<Object>} - Created map document
   */
  async createMap(mapData) {
    try {
      // Add created and updated timestamps
      const data = {
        ...mapData,
        created: firebase.firestore.FieldValue.serverTimestamp(),
        updated: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('maps').add(data);
      
      // Get the created document
      const doc = await docRef.get();
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error creating map:', error);
      throw error;
    }
  }
  
  /**
   * Update a map
   * @param {string} mapId - Map ID
   * @param {Object} mapData - Map data to update
   * @returns {Promise<void>}
   */
  async updateMap(mapId, mapData) {
    try {
      await this.db.collection('maps').doc(mapId).update({
        ...mapData,
        updated: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating map:', error);
      throw error;
    }
  }
  
  /**
   * Delete a map and all its stakeholders
   * @param {string} mapId - Map ID
   * @returns {Promise<void>}
   */
  async deleteMap(mapId) {
    try {
      // Start a batch
      const batch = this.db.batch();
      
      // Delete the map
      batch.delete(this.db.collection('maps').doc(mapId));
      
      // Get stakeholders for this map
      const stakeholdersSnapshot = await this.db.collection('stakeholders')
        .where('mapId', '==', mapId)
        .get();
      
      // Add delete operations to batch
      stakeholdersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error deleting map:', error);
      throw error;
    }
  }
  
  /**
   * Create a new stakeholder
   * @param {Object} stakeholderData - Stakeholder data
   * @returns {Promise<Object>} - Created stakeholder document
   */
  async createStakeholder(stakeholderData) {
    try {
      // Add created and updated timestamps
      const data = {
        ...stakeholderData,
        created: firebase.firestore.FieldValue.serverTimestamp(),
        updated: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('stakeholders').add(data);
      
      // Get the created document
      const doc = await docRef.get();
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error creating stakeholder:', error);
      throw error;
    }
  }
  
  /**
   * Update a stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @param {Object} stakeholderData - Stakeholder data to update
   * @returns {Promise<void>}
   */
  async updateStakeholder(stakeholderId, stakeholderData) {
    try {
      await this.db.collection('stakeholders').doc(stakeholderId).update({
        ...stakeholderData,
        updated: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating stakeholder:', error);
      throw error;
    }
  }
  
  /**
   * Delete a stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<void>}
   */
  async deleteStakeholder(stakeholderId) {
    try {
      await this.db.collection('stakeholders').doc(stakeholderId).delete();
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
      throw error;
    }
  }
  
  /**
   * Set up real-time listeners for maps
   * @param {string} userId - User ID
   * @param {Function} onMapsUpdate - Callback for maps updates
   * @returns {Function} - Unsubscribe function
   */
  listenToUserMaps(userId, onMapsUpdate) {
    return this.db.collection('maps')
      .where('ownerId', '==', userId)
      .onSnapshot(
        snapshot => {
          const maps = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          onMapsUpdate(maps);
        },
        error => {
          console.error('Error listening to maps:', error);
          EventBus.emit('firebase:error', {
            source: 'listenToUserMaps',
            error: error
          });
        }
      );
  }
  
  /**
   * Set up real-time listeners for stakeholders in a map
   * @param {string} mapId - Map ID
   * @param {Function} onStakeholdersUpdate - Callback for stakeholders updates
   * @returns {Function} - Unsubscribe function
   */
  listenToMapStakeholders(mapId, onStakeholdersUpdate) {
    return this.db.collection('stakeholders')
      .where('mapId', '==', mapId)
      .onSnapshot(
        snapshot => {
          const stakeholders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          onStakeholdersUpdate(stakeholders);
        },
        error => {
          console.error('Error listening to stakeholders:', error);
          EventBus.emit('firebase:error', {
            source: 'listenToMapStakeholders',
            error: error
          });
        }
      );
  }
  
  /**
   * Get API key from user settings
   * @param {string} userId - User ID
   * @param {string} keyName - Name of the API key
   * @returns {Promise<string|null>} - API key or null if not found
   */
  async getApiKey(userId, keyName) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) return null;
      
      const userData = userDoc.data();
      const settings = userData.settings || {};
      const apiKeys = settings.apiKeys || {};
      
      return apiKeys[keyName] || null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }
  
  /**
   * Set API key in user settings
   * @param {string} userId - User ID
   * @param {string} keyName - Name of the API key
   * @param {string} keyValue - API key value
   * @returns {Promise<void>}
   */
  async setApiKey(userId, keyName, keyValue) {
    try {
      const userRef = this.db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      // Update using FieldValue to avoid overwriting other settings
      await userRef.update({
        [`settings.apiKeys.${keyName}`]: keyValue,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      EventBus.emit('user:api-key-updated', { keyName });
    } catch (error) {
      console.error('Error setting API key:', error);
      throw error;
    }
  }
}

// Singleton instance
export default new FirebaseService();
