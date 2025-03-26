/**
 * Settings Service
 * Manages user settings and preferences using Firebase or local storage
 */

import firebase from 'firebase/app'
import 'firebase/firestore'
import { authService } from '@/services/authService'
import { localStorageService } from '@/services/localStorageService'

class SettingsService {
  /**
   * Get settings for the current user
   * @returns {Promise<Object>} - User settings
   */
  async getSettings() {
    try {
      if (authService.isAuthenticated()) {
        // Get from Firebase
        const userId = authService.getCurrentUser().uid
        const doc = await firebase.firestore()
          .collection('users')
          .doc(userId)
          .get()

        if (doc.exists && doc.data().settings) {
          return doc.data().settings
        }

        // If no settings found, return default settings
        return this.getDefaultSettings()
      } else {
        // Get from local storage
        const settings = localStorageService.getSettings()
        return settings || this.getDefaultSettings()
      }
    } catch (error) {
      console.error('Error getting settings:', error)
      return this.getDefaultSettings()
    }
  }

  /**
   * Update settings for the current user
   * @param {Object} settingsData - Settings to update
   * @returns {Promise<Object>} - Updated settings
   */
  async updateSettings(settingsData) {
    try {
      // Get current settings
      const currentSettings = await this.getSettings()

      // Merge with new settings
      const updatedSettings = this.mergeSettings(currentSettings, settingsData)

      if (authService.isAuthenticated()) {
        // Update in Firebase
        const userId = authService.getCurrentUser().uid
        await firebase.firestore()
          .collection('users')
          .doc(userId)
          .update({
            settings: updatedSettings,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          })
      } else {
        // Update in local storage
        localStorageService.saveSettings(updatedSettings)
      }

      return updatedSettings
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  /**
   * Reset settings to defaults
   * @returns {Promise<Object>} - Default settings
   */
  async resetSettings() {
    try {
      const defaultSettings = this.getDefaultSettings()

      if (authService.isAuthenticated()) {
        // Update in Firebase
        const userId = authService.getCurrentUser().uid
        await firebase.firestore()
          .collection('users')
          .doc(userId)
          .update({
            settings: defaultSettings,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          })
      } else {
        // Update in local storage
        localStorageService.saveSettings(defaultSettings)
      }

      return defaultSettings
    } catch (error) {
      console.error('Error resetting settings:', error)
      throw error
    }
  }

  /**
   * Get default settings
   * @returns {Object} - Default settings
   */
  getDefaultSettings() {
    return {
      appearance: {
        themeMode: 'light',
        matrixSettings: {
          showLabels: true,
          showNames: false,
          influenceThreshold: 5.5,
          impactThreshold: 5.5
        }
      },
      notifications: {
        upcomingInteractions: true,
        mapSharing: true,
        appUpdates: true,
        inAppEnabled: true,
        interactionReminders: true
      }
    }
  }

  /**
   * Merge settings objects
   * @param {Object} currentSettings - Current settings
   * @param {Object} newSettings - New settings to merge
   * @returns {Object} - Merged settings
   */
  mergeSettings(currentSettings, newSettings) {
    const mergedSettings = { ...currentSettings }

    // Handle each top-level key
    Object.keys(newSettings).forEach(key => {
      if (typeof newSettings[key] === 'object' && newSettings[key] !== null &&
        typeof mergedSettings[key] === 'object' && mergedSettings[key] !== null) {
        // Recursively merge nested objects
        mergedSettings[key] = { ...mergedSettings[key], ...newSettings[key] }
      } else {
        // Replace primitive values
        mergedSettings[key] = newSettings[key]
      }
    })

    return mergedSettings
  }
}

export const settingsService = new SettingsService()
