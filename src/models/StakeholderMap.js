/**
 * StakeholderMap Model
 * Represents a collection of stakeholders with metadata
 */
import { v4 as uuidv4 } from 'uuid'
import config from '@/config'
import Stakeholder from './Stakeholder'

/**
 * StakeholderMap Model Class
 */
export class StakeholderMap {
  /**
   * Create a new StakeholderMap
   * @param {Object} data - StakeholderMap data
   */
  constructor(data = {}) {
    // Use a unique ID if not provided
    this._id = data.id || uuidv4()

    // Basic information
    this._name = data.name || config.defaults.stakeholderMap.name
    this._description = this._validateTextField(
      data.description,
      config.validation.stakeholderMap.descriptionMaxLength
    )

    // Project context
    this._projectName = data.projectName || ''
    this._projectGoals = data.projectGoals || ''
    this._projectScope = data.projectScope || ''

    // Stakeholders collection (initialize empty or from provided data)
    this._stakeholders = data.stakeholders
      ? data.stakeholders.map(s => new Stakeholder({ ...s, mapId: this._id }))
      : []

    // Metadata
    this._createdAt = data.createdAt || new Date()
    this._updatedAt = data.updatedAt || new Date()
    this._createdBy = data.createdBy || null
    this._isArchived = !!data.isArchived

    // View settings
    this._viewSettings = {
      layout: data.viewSettings?.layout || 'grid',
      sortBy: data.viewSettings?.sortBy || 'name',
      sortDirection: data.viewSettings?.sortDirection || 'asc',
      filterCategory: data.viewSettings?.filterCategory || 'all',
      filterQuadrant: data.viewSettings?.filterQuadrant || 'all',
      ...data.viewSettings
    }
  }

  // Getters
  get id() { return this._id }
  get name() { return this._name }
  get description() { return this._description }
  get projectName() { return this._projectName }
  get projectGoals() { return this._projectGoals }
  get projectScope() { return this._projectScope }
  get stakeholders() { return [...this._stakeholders] } // Return a copy to prevent direct mutation
  get createdAt() { return this._createdAt }
  get updatedAt() { return this._updatedAt }
  get createdBy() { return this._createdBy }
  get isArchived() { return this._isArchived }
  get viewSettings() { return { ...this._viewSettings } } // Return a copy to prevent direct mutation

  // Get count of stakeholders
  get stakeholderCount() {
    return this._stakeholders.length
  }

  // Get stakeholders grouped by quadrant
  get stakeholdersByQuadrant() {
    const quadrants = {
      'manage-closely': [],
      'keep-satisfied': [],
      'keep-informed': [],
      'monitor': []
    }

    for (const stakeholder of this._stakeholders) {
      quadrants[stakeholder.quadrant].push(stakeholder)
    }

    return quadrants
  }

  // Get stakeholders grouped by category
  get stakeholdersByCategory() {
    const categories = {}

    for (const stakeholder of this._stakeholders) {
      if (!categories[stakeholder.category]) {
        categories[stakeholder.category] = []
      }
      categories[stakeholder.category].push(stakeholder)
    }

    return categories
  }

  // Setters with validation
  set name(value) {
    this._name = this._validateTextField(value, config.validation.stakeholderMap.nameMaxLength) || config.defaults.stakeholderMap.name
    this._markUpdated()
  }

  set description(value) {
    this._description = this._validateTextField(value, config.validation.stakeholderMap.descriptionMaxLength)
    this._markUpdated()
  }

  set projectName(value) {
    this._projectName = this._validateTextField(value, 200)
    this._markUpdated()
  }

  set projectGoals(value) {
    this._projectGoals = this._validateTextField(value, 1000)
    this._markUpdated()
  }

  set projectScope(value) {
    this._projectScope = this._validateTextField(value, 1000)
    this._markUpdated()
  }

  set isArchived(value) {
    this._isArchived = !!value
    this._markUpdated()
  }

  set viewSettings(settings) {
    this._viewSettings = {
      ...this._viewSettings,
      ...settings
    }
    this._markUpdated()
  }

  /**
   * Add a stakeholder to the map
   * @param {Stakeholder|Object} stakeholderData - Stakeholder instance or data
   * @returns {Stakeholder} The added stakeholder
   */
  addStakeholder(stakeholderData) {
    // Check if we've reached the maximum number of stakeholders
    if (this._stakeholders.length >= config.validation.stakeholder.maxStakeholdersPerMap) {
      throw new Error(`Cannot add more than ${config.validation.stakeholder.maxStakeholdersPerMap} stakeholders to a map`)
    }

    let stakeholder

    if (stakeholderData instanceof Stakeholder) {
      stakeholder = stakeholderData
      stakeholder._mapId = this._id
    } else {
      stakeholder = new Stakeholder({
        ...stakeholderData,
        mapId: this._id
      })
    }

    this._stakeholders.push(stakeholder)
    this._markUpdated()

    return stakeholder
  }

  /**
   * Get a stakeholder by ID
   * @param {string} id - Stakeholder ID
   * @returns {Stakeholder|null} The stakeholder or null if not found
   */
  getStakeholder(id) {
    return this._stakeholders.find(s => s.id === id) || null
  }

  /**
   * Update a stakeholder
   * @param {string} id - Stakeholder ID
   * @param {Object} updates - Properties to update
   * @returns {Stakeholder|null} Updated stakeholder or null if not found
   */
  updateStakeholder(id, updates) {
    const index = this._stakeholders.findIndex(s => s.id === id)

    if (index === -1) {
      return null
    }

    const stakeholder = this._stakeholders[index]

    // Apply updates to stakeholder
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'mapId' && key !== 'createdAt' && key !== 'createdBy') {
        stakeholder[key] = value
      }
    })

    this._markUpdated()

    return stakeholder
  }

  /**
   * Remove a stakeholder by ID
   * @param {string} id - Stakeholder ID
   * @returns {boolean} Whether the stakeholder was removed
   */
  removeStakeholder(id) {
    const initialLength = this._stakeholders.length
    this._stakeholders = this._stakeholders.filter(s => s.id !== id)

    if (this._stakeholders.length !== initialLength) {
      this._markUpdated()
      return true
    }

    return false
  }

  /**
   * Add an interaction to a stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @param {Object} interaction - Interaction data
   * @returns {Object|null} The added interaction or null if stakeholder not found
   */
  addStakeholderInteraction(stakeholderId, interaction) {
    const stakeholder = this.getStakeholder(stakeholderId)

    if (!stakeholder) {
      return null
    }

    const newInteraction = stakeholder.addInteraction(interaction)
    this._markUpdated()

    return newInteraction
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain JavaScript object
   */
  toObject() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      projectName: this._projectName,
      projectGoals: this._projectGoals,
      projectScope: this._projectScope,
      stakeholders: this._stakeholders.map(s => s.toObject()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      createdBy: this._createdBy,
      isArchived: this._isArchived,
      viewSettings: { ...this._viewSettings }
    }
  }

  /**
   * Create a StakeholderMap instance from a plain object
   * @param {Object} data - Plain JavaScript object
   * @returns {StakeholderMap} New StakeholderMap instance
   */
  static fromObject(data) {
    return new StakeholderMap(data)
  }

  /**
   * Create a default StakeholderMap
   * @param {string} userId - User ID of the creator
   * @returns {StakeholderMap} New StakeholderMap with default values
   */
  static createDefault(userId = null) {
    return new StakeholderMap({
      name: config.defaults.stakeholderMap.name,
      description: config.defaults.stakeholderMap.description,
      createdBy: userId
    })
  }

  /**
   * Validate a text field
   * @param {string} value - Text to validate
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Validated text
   * @private
   */
  _validateTextField(value, maxLength) {
    if (!value) return ''

    // Convert to string if not already
    const strValue = String(value)

    // Truncate if too long
    return strValue.length > maxLength ? strValue.substring(0, maxLength) : strValue
  }

  /**
   * Mark the map as updated
   * @private
   */
  _markUpdated() {
    this._updatedAt = new Date()
  }
}

export default StakeholderMap 