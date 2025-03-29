import { ref, computed } from 'vue'
import { stakeholderService } from '@/services'

const stakeholdersMap = ref({}) // Maps will contain stakeholders by mapId
const loadingStatus = ref({}) // Loading status by mapId

/**
 * Stakeholder store
 * Manages stakeholder data across the application
 */
export function useStakeholderStore() {
  /**
   * Load stakeholders for a specific map
   * @param {string} mapId - The map ID to load stakeholders for
   */
  async function loadStakeholders(mapId) {
    if (!mapId) return

    try {
      loadingStatus.value[mapId] = true
      const stakeholders = await stakeholderService.getStakeholders(mapId)
      stakeholdersMap.value[mapId] = stakeholders
    } catch (error) {
      console.error('Error loading stakeholders:', error)
      stakeholdersMap.value[mapId] = []
    } finally {
      loadingStatus.value[mapId] = false
    }
  }

  /**
   * Get stakeholders for a specific map
   * @param {string} mapId - The map ID to get stakeholders for
   * @returns {Array} The stakeholders for the map
   */
  function getStakeholders(mapId) {
    return stakeholdersMap.value[mapId] || []
  }

  /**
   * Check if stakeholders for a map are currently loading
   * @param {string} mapId - The map ID to check loading status for
   * @returns {boolean} True if loading, false otherwise
   */
  function isLoading(mapId) {
    return !!loadingStatus.value[mapId]
  }

  /**
   * Get a single stakeholder by ID
   * @param {string} mapId - The map ID the stakeholder belongs to
   * @param {string} stakeholderId - The ID of the stakeholder to get
   * @returns {Object|null} The stakeholder object or null if not found
   */
  function getStakeholderById(mapId, stakeholderId) {
    const stakeholders = stakeholdersMap.value[mapId] || []
    return stakeholders.find(s => s.id === stakeholderId) || null
  }

  return {
    getStakeholders,
    loadStakeholders,
    isLoading,
    getStakeholderById
  }
}
