import { firestore } from '../../firebase/firebaseConfig.js';
import { Stakeholder } from '../models/stakeholder.js';
import { StakeholderMap } from '../models/map.js';
import { EventBus } from '../utils/eventBus.js';
import localStorageService from './localStorageService.js';
import authService from './authService.js';

/**
 * Data Service - Manages all data operations between local storage and Firebase
 */
export class DataService {
  constructor() {
    this.currentMapId = null;
    this.maps = new Map(); // Map ID -> StakeholderMap instance
    this._initSync();
  }

  /**
   * Initialize data sync between local storage and Firebase
   * @private
   */
  _initSync() {
    // Listen for authentication changes
    EventBus.on('auth:login', user => {
      this._syncDataToCloud(user.uid);
    });

    // Load data from local storage on initialization
    this._loadFromLocalStorage();
  }

  /**
   * Load maps from local storage
   * @private
   */
  _loadFromLocalStorage() {
    const maps = localStorageService.getMaps();

    if (maps && maps.length > 0) {
      maps.forEach(mapData => {
        const map = StakeholderMap.fromObject(mapData);

        // Load stakeholders for this map
        const stakeholders = localStorageService.getStakeholders(map.id) || [];
        stakeholders.forEach(stakeholderData => {
          const stakeholder = Stakeholder.fromObject(stakeholderData);
          map.addStakeholder(stakeholder);
        });

        this.maps.set(map.id, map);
      });

      // Set current map if stored in local storage
      const currentMapId = localStorageService.getCurrentMapId();
      if (currentMapId && this.maps.has(currentMapId)) {
        this.currentMapId = currentMapId;
      }
    }
  }

  /**
   * Sync local data to Firebase when user logs in
   * @param {string} userId - User ID
   * @private
   */
  async _syncDataToCloud(userId) {
    try {
      // Check if user has maps in Firestore
      const cloudMaps = await this._fetchCloudMaps(userId);
      const localMaps = Array.from(this.maps.values());

      // If user has no maps in the cloud but has local maps, push local maps to cloud
      if (cloudMaps.length === 0 && localMaps.length > 0) {
        // Convert anonymous maps to owned maps
        for (const map of localMaps) {
          map.ownerId = userId;
          await this._saveMapToCloud(map);

          // Save each stakeholder to the cloud
          for (const stakeholder of map.stakeholders) {
            await this._saveStakeholderToCloud(stakeholder);
          }
        }
      }
      // If user has maps in the cloud, merge with local maps
      else if (cloudMaps.length > 0) {
        // Clear local maps and load from cloud
        this.maps.clear();

        for (const mapData of cloudMaps) {
          const map = StakeholderMap.fromObject(mapData);

          // Fetch stakeholders for this map
          const stakeholders = await this._fetchCloudStakeholders(map.id);
          stakeholders.forEach(stakeholderData => {
            const stakeholder = Stakeholder.fromObject(stakeholderData);
            map.addStakeholder(stakeholder);
          });

          this.maps.set(map.id, map);
        }

        // Update local storage
        this._saveAllToLocalStorage();
      }

      // Set current map if needed
      if (!this.currentMapId && this.maps.size > 0) {
        this.currentMapId = this.maps.values().next().value.id;
      }

      // Emit event that data has been synced
      EventBus.emit('data:synced', Array.from(this.maps.values()));
    } catch (error) {
      console.error('Error syncing data to cloud:', error);
      EventBus.emit('data:sync-error', error);
    }
  }

  /**
   * Fetch maps from Firebase for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Promise resolving to array of map data
   * @private
   */
  async _fetchCloudMaps(userId) {
    try {
      const snapshot = await firestore.collection('maps')
        .where('ownerId', '==', userId)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching cloud maps:', error);
      return [];
    }
  }

  /**
   * Fetch stakeholders from Firebase for a map
   * @param {string} mapId - Map ID
   * @returns {Promise<Array>} - Promise resolving to array of stakeholder data
   * @private
   */
  async _fetchCloudStakeholders(mapId) {
    try {
      const snapshot = await firestore.collection('stakeholders')
        .where('mapId', '==', mapId)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching cloud stakeholders:', error);
      return [];
    }
  }

  /**
   * Save a map to Firebase
   * @param {StakeholderMap} map - Map to save
   * @returns {Promise} - Firestore operation promise
   * @private
   */
  async _saveMapToCloud(map) {
    if (!authService.isAuthenticated()) return;

    try {
      const mapData = map.toObject();
      await firestore.collection('maps').doc(map.id).set(mapData);
    } catch (error) {
      console.error('Error saving map to cloud:', error);
      throw error;
    }
  }

  /**
   * Save a stakeholder to Firebase
   * @param {Stakeholder} stakeholder - Stakeholder to save
   * @returns {Promise} - Firestore operation promise
   * @private
   */
  async _saveStakeholderToCloud(stakeholder) {
    if (!authService.isAuthenticated()) return;

    try {
      const stakeholderData = stakeholder.toObject();
      await firestore.collection('stakeholders').doc(stakeholder.id).set(stakeholderData);
    } catch (error) {
      console.error('Error saving stakeholder to cloud:', error);
      throw error;
    }
  }

  /**
   * Delete a map from Firebase
   * @param {string} mapId - Map ID to delete
   * @returns {Promise} - Firestore operation promise
   * @private
   */
  async _deleteMapFromCloud(mapId) {
    if (!authService.isAuthenticated()) return;

    try {
      // Delete map document
      await firestore.collection('maps').doc(mapId).delete();

      // Delete all stakeholders for this map
      const stakeholdersSnapshot = await firestore.collection('stakeholders')
        .where('mapId', '==', mapId)
        .get();

      const batch = firestore.batch();
      stakeholdersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting map from cloud:', error);
      throw error;
    }
  }

  /**
   * Delete a stakeholder from Firebase
   * @param {string} stakeholderId - Stakeholder ID to delete
   * @returns {Promise} - Firestore operation promise
   * @private
   */
  async _deleteStakeholderFromCloud(stakeholderId) {
    if (!authService.isAuthenticated()) return;

    try {
      await firestore.collection('stakeholders').doc(stakeholderId).delete();
    } catch (error) {
      console.error('Error deleting stakeholder from cloud:', error);
      throw error;
    }
  }

  /**
   * Save all maps and stakeholders to local storage
   * @private
   */
  _saveAllToLocalStorage() {
    const maps = Array.from(this.maps.values()).map(map => map.toObject());
    localStorageService.saveMaps(maps);

    // Save stakeholders for each map
    this.maps.forEach(map => {
      const stakeholders = map.stakeholders.map(s => s.toObject());
      localStorageService.saveStakeholders(map.id, stakeholders);
    });

    // Save current map ID
    if (this.currentMapId) {
      localStorageService.saveCurrentMapId(this.currentMapId);
    }
  }

  /**
   * Get all maps
   * @returns {Array} - Array of StakeholderMap instances
   */
  getAllMaps() {
    return Array.from(this.maps.values());
  }

  /**
   * Get a map by ID
   * @param {string} mapId - Map ID
   * @returns {StakeholderMap|null} - StakeholderMap instance if found, null otherwise
   */
  getMapById(mapId) {
    return this.maps.get(mapId) || null;
  }

  /**
   * Get the current map
   * @returns {StakeholderMap|null} - Current StakeholderMap instance if set, null otherwise
   */
  getCurrentMap() {
    return this.currentMapId ? this.maps.get(this.currentMapId) : null;
  }

  /**
   * Set the current map
   * @param {string} mapId - Map ID to set as current
   */
  setCurrentMap(mapId) {
    if (this.maps.has(mapId)) {
      this.currentMapId = mapId;
      localStorageService.saveCurrentMapId(mapId);
      EventBus.emit('map:current-changed', this.maps.get(mapId));
    }
  }

  /**
   * Create a new map
   * @param {Object} mapData - Map data
   * @returns {StakeholderMap} - Newly created StakeholderMap instance
   */
  async createMap(mapData) {
    const map = new StakeholderMap(mapData);

    // Set owner ID if authenticated
    if (authService.isAuthenticated()) {
      map.ownerId = authService.getCurrentUser().uid;
      await this._saveMapToCloud(map);
    }

    // Add to local maps
    this.maps.set(map.id, map);
    this._saveAllToLocalStorage();

    // Set as current map if none is set
    if (!this.currentMapId) {
      this.setCurrentMap(map.id);
    }

    EventBus.emit('map:created', map);
    return map;
  }

  /**
   * Update a map
   * @param {string} mapId - Map ID to update
   * @param {Object} mapData - New map data
   * @returns {StakeholderMap} - Updated StakeholderMap instance
   */
  async updateMap(mapId, mapData) {
    const map = this.maps.get(mapId);
    if (!map) throw new Error(`Map not found: ${mapId}`);

    map.update(mapData);

    // Update in cloud if authenticated
    if (authService.isAuthenticated()) {
      await this._saveMapToCloud(map);
    }

    this._saveAllToLocalStorage();
    EventBus.emit('map:updated', map);

    return map;
  }

  /**
   * Delete a map
   * @param {string} mapId - Map ID to delete
   * @returns {boolean} - True if successfully deleted, false otherwise
   */
  async deleteMap(mapId) {
    if (!this.maps.has(mapId)) return false;

    // Delete from cloud if authenticated
    if (authService.isAuthenticated()) {
      await this._deleteMapFromCloud(mapId);
    }

    // Delete from local maps
    this.maps.delete(mapId);

    // Update current map if deleted map was current
    if (this.currentMapId === mapId) {
      this.currentMapId = this.maps.size > 0 ? this.maps.keys().next().value : null;
      localStorageService.saveCurrentMapId(this.currentMapId);
    }

    this._saveAllToLocalStorage();
    EventBus.emit('map:deleted', mapId);

    return true;
  }

  /**
   * Add a stakeholder to a map
   * @param {string} mapId - Map ID to add stakeholder to
   * @param {Object} stakeholderData - Stakeholder data
   * @returns {Stakeholder} - Newly created Stakeholder instance
   */
  async addStakeholder(mapId, stakeholderData) {
    const map = this.maps.get(mapId);
    if (!map) throw new Error(`Map not found: ${mapId}`);

    const stakeholder = new Stakeholder({ ...stakeholderData, mapId });
    map.addStakeholder(stakeholder);

    // Save to cloud if authenticated
    if (authService.isAuthenticated()) {
      await this._saveStakeholderToCloud(stakeholder);
    }

    this._saveAllToLocalStorage();
    EventBus.emit('stakeholder:added', { map, stakeholder });

    return stakeholder;
  }

  /**
   * Update a stakeholder
   * @param {string} stakeholderId - Stakeholder ID to update
   * @param {Object} stakeholderData - New stakeholder data
   * @returns {Stakeholder} - Updated Stakeholder instance
   */
  async updateStakeholder(stakeholderId, stakeholderData) {
    let updatedStakeholder = null;

    // Find the map containing this stakeholder
    for (const map of this.maps.values()) {
      const stakeholder = map.getStakeholder(stakeholderId);
      if (stakeholder) {
        stakeholder.update(stakeholderData);
        updatedStakeholder = stakeholder;

        // Save to cloud if authenticated
        if (authService.isAuthenticated()) {
          await this._saveStakeholderToCloud(stakeholder);
        }

        break;
      }
    }

    if (!updatedStakeholder) {
      throw new Error(`Stakeholder not found: ${stakeholderId}`);
    }

    this._saveAllToLocalStorage();
    EventBus.emit('stakeholder:updated', updatedStakeholder);

    return updatedStakeholder;
  }

  /**
   * Delete a stakeholder
   * @param {string} stakeholderId - Stakeholder ID to delete
   * @returns {boolean} - True if successfully deleted, false otherwise
   */
  async deleteStakeholder(stakeholderId) {
    let deleted = false;

    // Find the map containing this stakeholder
    for (const map of this.maps.values()) {
      if (map.removeStakeholder(stakeholderId)) {
        deleted = true;

        // Delete from cloud if authenticated
        if (authService.isAuthenticated()) {
          await this._deleteStakeholderFromCloud(stakeholderId);
        }

        break;
      }
    }

    if (deleted) {
      this._saveAllToLocalStorage();
      EventBus.emit('stakeholder:deleted', stakeholderId);
    }

    return deleted;
  }

  /**
   * Add an interaction to a stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @param {string} text - Interaction text
   * @returns {Object} - Newly created interaction
   */
  async addInteraction(stakeholderId, text) {
    let interaction = null;
    let stakeholder = null;

    // Find the stakeholder
    for (const map of this.maps.values()) {
      stakeholder = map.getStakeholder(stakeholderId);
      if (stakeholder) {
        interaction = stakeholder.addInteraction(text);

        // Save to cloud if authenticated
        if (authService.isAuthenticated()) {
          await this._saveStakeholderToCloud(stakeholder);
        }

        break;
      }
    }

    if (!interaction) {
      throw new Error(`Stakeholder not found: ${stakeholderId}`);
    }

    this._saveAllToLocalStorage();
    EventBus.emit('interaction:added', { stakeholder, interaction });

    return interaction;
  }

  /**
   * Import data from JSON
   * @param {Object} data - Data to import
   * @returns {StakeholderMap} - Imported map
   */
  async importData(data) {
    try {
      // Create map
      const mapData = data.map || { name: 'Imported Map' };
      const map = new StakeholderMap(mapData);

      // Set owner ID if authenticated
      if (authService.isAuthenticated()) {
        map.ownerId = authService.getCurrentUser().uid;
      }

      // Add stakeholders
      if (data.stakeholders && Array.isArray(data.stakeholders)) {
        data.stakeholders.forEach(stakeholderData => {
          const stakeholder = new Stakeholder({
            ...stakeholderData,
            id: undefined, // Generate new ID
            mapId: map.id
          });
          map.addStakeholder(stakeholder);
        });
      }

      // Save to cloud if authenticated
      if (authService.isAuthenticated()) {
        await this._saveMapToCloud(map);

        for (const stakeholder of map.stakeholders) {
          await this._saveStakeholderToCloud(stakeholder);
        }
      }

      // Add to local maps
      this.maps.set(map.id, map);
      this._saveAllToLocalStorage();

      // Set as current map
      this.setCurrentMap(map.id);

      EventBus.emit('data:imported', map);
      return map;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

// Create and export a default instance of DataService
export default new DataService();
