/**
 * Local Storage Service - Manages data persistence in browser's local storage
 */
class LocalStorageService {
  constructor() {
    this.prefix = 'staketrack_'
    this.mapsKey = `${this.prefix}maps`
    this.currentMapKey = `${this.prefix}current_map_id`
    this.settingsKey = `${this.prefix}settings`
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
   * Get maps from local storage
   * @returns {Array} - Array of map objects or empty array if not found
   */
  getMaps() {
    return this._getItem(this.mapsKey) || []
  }

  /**
   * Save maps to local storage
   * @param {Array} maps - Array of map objects
   * @returns {boolean} - True if successful, false otherwise
   */
  saveMaps(maps) {
    return this._setItem(this.mapsKey, maps)
  }

  /**
   * Get stakeholders for a map from local storage
   * @param {string} mapId - Map ID
   * @returns {Array} - Array of stakeholder objects or empty array if not found
   */
  getStakeholders(mapId) {
    return this._getItem(`${this.prefix}stakeholders_${mapId}`) || []
  }

  /**
   * Save stakeholders for a map to local storage
   * @param {string} mapId - Map ID
   * @param {Array} stakeholders - Array of stakeholder objects
   * @returns {boolean} - True if successful, false otherwise
   */
  saveStakeholders(mapId, stakeholders) {
    return this._setItem(`${this.prefix}stakeholders_${mapId}`, stakeholders)
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
   * Get current map ID from local storage
   * @returns {string|null} - Current map ID or null if not found
   */
  getCurrentMapId() {
    return this._getItem(this.currentMapKey)
  }

  /**
   * Save current map ID to local storage
   * @param {string} mapId - Map ID
   * @returns {boolean} - True if successful, false otherwise
   */
  saveCurrentMapId(mapId) {
    return this._setItem(this.currentMapKey, mapId)
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
}

// Export singleton instance
export const localStorageService = new LocalStorageService()
