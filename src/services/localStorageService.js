import { Map } from '@/models/Map'
import { Stakeholder } from '@/models/Stakeholder'

const STORAGE_KEYS = {
  MAPS: 'staketrack_maps',
  CURRENT_MAP: 'staketrack_current_map',
  VERSION: 'staketrack_data_version'
}

const CURRENT_VERSION = '1.0'

/**
 * Local Storage Service - Manages data persistence in browser's local storage
 */
class LocalStorageService {
  constructor() {
    this.prefix = 'staketrack_'
    this.mapsKey = STORAGE_KEYS.MAPS
    this.currentMapKey = STORAGE_KEYS.CURRENT_MAP
    this.settingsKey = `${this.prefix}settings`

    // Initialize with static methods for backward compatibility
    this.getMaps = this._getMaps.bind(this)
    this.saveMaps = this._saveMaps.bind(this)
    this.getMap = this._getMap.bind(this)
    this.saveMap = this._saveMap.bind(this)
    this.deleteMap = this._deleteMap.bind(this)
    this.setCurrentMapId = this._setCurrentMapId.bind(this)
    this.getCurrentMapId = this._getCurrentMapId.bind(this)
  }

  /**
   * Check if local storage is available
   * @returns {boolean} - True if local storage is available, false otherwise
   * @private
   */
  _isAvailable() {
    try {
      const testKey = `${this.prefix}test`
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (e) {
      console.warn('Local storage is not available:', e)
      return false
    }
  }

  /**
   * Get item from local storage
   * @param {string} key - Storage key
   * @returns {*} - Parsed item or null if not found
   * @private
   */
  _getItem(key) {
    if (!this._isAvailable()) return null

    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (e) {
      console.error(`Error getting item from local storage (${key}):`, e)
      return null
    }
  }

  /**
   * Set item in local storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} - True if successful, false otherwise
   * @private
   */
  _setItem(key, value) {
    if (!this._isAvailable()) return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error(`Error setting item in local storage (${key}):`, e)
      return false
    }
  }

  /**
   * Remove item from local storage
   * @param {string} key - Storage key
   * @returns {boolean} - True if successful, false otherwise
   * @private
   */
  _removeItem(key) {
    if (!this._isAvailable()) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.error(`Error removing item from local storage (${key}):`, e)
      return false
    }
  }

  /**
   * Get all maps from local storage
   * @returns {Map[]}
   */
  _getMaps() {
    try {
      const data = localStorage.getItem(this.mapsKey)
      console.log('DEBUG: Raw data from localStorage:', data, 'using key:', this.mapsKey)
      if (!data) return []

      const maps = JSON.parse(data)
      console.log('DEBUG: Parsed maps from localStorage:', maps)
      return maps.map(map => new Map(map))
    } catch (error) {
      console.error('Error getting maps from local storage:', error)
      return []
    }
  }

  /**
   * Save maps to local storage
   * @param {Map[]} maps
   */
  _saveMaps(maps) {
    try {
      console.log('DEBUG: Saving maps array to localStorage:', maps, 'using key:', this.mapsKey)
      const data = maps.map(map => map.toJSON ? map.toJSON() : map)
      console.log('DEBUG: Serialized maps data:', data)
      localStorage.setItem(this.mapsKey, JSON.stringify(data))

      // Verify storage
      const verification = localStorage.getItem(this.mapsKey)
      console.log('DEBUG: Verification from localStorage after save:', verification)

      return true
    } catch (error) {
      console.error('Error saving maps to local storage:', error)
      return false
    }
  }

  /**
   * Get stakeholders for a map from local storage
   * @param {string} mapId - Map ID
   * @returns {Array} - Array of stakeholder objects or empty array if not found
   */
  getStakeholders(mapId) {
    try {
      const key = `${this.prefix}stakeholders_${mapId}`
      console.log(`DEBUG: Getting stakeholders from localStorage with key: ${key}`)
      const data = localStorage.getItem(key)
      console.log('DEBUG: Raw stakeholder data from localStorage:', data)

      if (!data) return []

      // Parse the JSON data
      const stakeholderData = JSON.parse(data)
      console.log('DEBUG: Parsed stakeholder data:', stakeholderData)

      // Convert plain objects to Stakeholder instances
      return stakeholderData.map(data => new Stakeholder(data))
    } catch (error) {
      console.error('Error getting stakeholders from localStorage:', error)
      return []
    }
  }

  /**
   * Save stakeholders for a map to local storage
   * @param {string} mapId - Map ID
   * @param {Array} stakeholders - Array of stakeholder objects
   * @returns {boolean} - True if successful, false otherwise
   */
  saveStakeholders(mapId, stakeholders) {
    try {
      const key = `${this.prefix}stakeholders_${mapId}`
      console.log(`DEBUG: Saving stakeholders to localStorage with key: ${key}`)

      // Convert Stakeholder instances to plain objects
      const data = stakeholders.map(stakeholder => {
        // If stakeholder has toObject or toJSON method, use it
        if (stakeholder.toObject) {
          return stakeholder.toObject()
        } else if (stakeholder.toJSON) {
          return stakeholder.toJSON()
        } else {
          // Otherwise use as is
          return stakeholder
        }
      })

      console.log('DEBUG: Serialized stakeholder data:', data)

      localStorage.setItem(key, JSON.stringify(data))

      // Verify storage
      const verification = localStorage.getItem(key)
      console.log('DEBUG: Verification from localStorage after save:', verification)

      return true
    } catch (error) {
      console.error('Error saving stakeholders to localStorage:', error)
      return false
    }
  }

  /**
   * Delete stakeholders for a map from local storage
   * @param {string} mapId - Map ID
   * @returns {boolean} - True if successful, false otherwise
   */
  deleteStakeholders(mapId) {
    return this._removeItem(`${this.prefix}stakeholders_${mapId}`)
  }

  /**
   * Get a map by ID from local storage
   * @param {string} id
   * @returns {Map|null}
   */
  _getMap(id) {
    try {
      const maps = this._getMaps()
      const map = maps.find(m => m.id === id)
      return map || null
    } catch (error) {
      console.error('Error getting map from local storage:', error)
      return null
    }
  }

  /**
   * Save a map to local storage
   * @param {Map} map
   */
  _saveMap(map) {
    try {
      console.log('DEBUG: Saving map to localStorage:', map)
      const maps = this._getMaps()
      const index = maps.findIndex(m => m.id === map.id)

      if (index === -1) {
        console.log('DEBUG: Adding new map to array')
        maps.push(map)
      } else {
        console.log('DEBUG: Updating existing map at index', index)
        maps[index] = map
      }

      const result = this._saveMaps(maps)
      console.log('DEBUG: Result of saving maps:', result)
      return result
    } catch (error) {
      console.error('Error saving map to local storage:', error)
      return false
    }
  }

  /**
   * Delete a map from local storage
   * @param {string} id
   */
  _deleteMap(id) {
    try {
      const maps = this._getMaps().filter(map => map.id !== id)
      this._saveMaps(maps)

      // If this was the current map, clear it
      if (this._getCurrentMapId() === id) {
        this._setCurrentMapId(null)
      }
      return true
    } catch (error) {
      console.error('Error deleting map from local storage:', error)
      return false
    }
  }

  /**
   * Set current map ID in local storage
   * @param {string} id
   * @returns {boolean} - True if successful, false otherwise
   */
  _setCurrentMapId(id) {
    try {
      console.log('DEBUG: Saving current map ID to localStorage:', id, 'using key:', this.currentMapKey)
      if (id) {
        return this._setItem(this.currentMapKey, id)
      } else {
        return this._removeItem(this.currentMapKey)
      }
    } catch (error) {
      console.error('Error setting current map ID in local storage:', error)
      return false
    }
  }

  /**
   * Get current map ID from local storage
   * @returns {string|null} - Map ID or null if not found
   */
  _getCurrentMapId() {
    try {
      const id = this._getItem(this.currentMapKey)
      console.log('DEBUG: Retrieved current map ID from localStorage:', id, 'using key:', this.currentMapKey)
      return id
    } catch (error) {
      console.error('Error getting current map ID from local storage:', error)
      return null
    }
  }

  /**
   * Get settings from local storage
   * @returns {Object} - Settings object or empty object if not found
   */
  getSettings() {
    return this._getItem(this.settingsKey) || {}
  }

  /**
   * Save settings to local storage
   * @param {Object} settings - Settings object
   * @returns {boolean} - True if successful, false otherwise
   */
  saveSettings(settings) {
    return this._setItem(this.settingsKey, settings)
  }

  /**
   * Update settings in local storage
   * @param {Object} newSettings - New settings to merge with existing settings
   * @returns {Object} - Updated settings object
   */
  updateSettings(newSettings) {
    const currentSettings = this.getSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }
    this.saveSettings(updatedSettings)
    return updatedSettings
  }

  /**
   * Clear all StakeTrack data from local storage
   * @returns {boolean} - True if successful, false otherwise
   */
  clearAll() {
    if (!this._isAvailable()) return false

    try {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.startsWith(this.prefix)) {
          keys.push(key)
        }
      }

      keys.forEach(key => localStorage.removeItem(key))
      return true
    } catch (e) {
      console.error('Error clearing local storage:', e)
      return false
    }
  }

  /**
   * Get the storage usage information
   * @returns {Object} - Storage usage information
   */
  getStorageInfo() {
    if (!this._isAvailable()) return { used: 0, total: 0, percentage: 0 }

    try {
      let totalSize = 0
      let appSize = 0

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        const value = localStorage.getItem(key)
        const size = (key.length + value.length) * 2 // Approximate size in bytes

        totalSize += size

        if (key.startsWith(this.prefix)) {
          appSize += size
        }
      }

      // Local storage limit is typically around 5MB
      const limit = 5 * 1024 * 1024

      return {
        used: appSize,
        total: limit,
        percentage: Math.round((appSize / limit) * 100),
        usedFormatted: this._formatSize(appSize),
        totalFormatted: this._formatSize(limit)
      }
    } catch (e) {
      console.error('Error getting storage info:', e)
      return { used: 0, total: 0, percentage: 0 }
    }
  }

  /**
   * Format size in bytes to human-readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size string
   * @private
   */
  _formatSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }
  }

  /**
   * Initialize local storage
   */
  static init() {
    try {
      // Check version and migrate if needed
      const version = localStorage.getItem(STORAGE_KEYS.VERSION)
      if (version !== CURRENT_VERSION) {
        this._migrateData(version)
      }
    } catch (error) {
      console.error('Error initializing local storage:', error)
      throw error
    }
  }

  /**
   * Migrate data to new version
   * @private
   * @param {string|null} fromVersion
   */
  static _migrateData(fromVersion) {
    // Implement migration strategies here
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION)
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService()
