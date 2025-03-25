/**
 * Stakeholder Model
 * Represents a stakeholder entity with proper encapsulation and validation
 */
import { v4 as uuidv4 } from 'uuid'
import config from '@/config'

/**
 * Stakeholder Model Class
 */
export class Stakeholder {
  /**
   * Create a new Stakeholder
   * @param {Object} data - Stakeholder data
   */
  constructor(data = {}) {
    // Use a unique ID if not provided
    this._id = data.id || uuidv4()
    this._mapId = data.mapId || null

    // Core stakeholder information
    this._name = data.name || ''
    this._influence = this._validateNumericRange(data.influence, 1, 10, 5)
    this._impact = this._validateNumericRange(data.impact, 1, 10, 5)
    this._relationship = this._validateNumericRange(data.relationship, 1, 10, 5)
    this._category = this._validateCategory(data.category)

    // Additional stakeholder details
    this._interests = this._validateTextField(data.interests, config.validation.stakeholder.interestsMaxLength)
    this._contribution = this._validateTextField(data.contribution, config.validation.stakeholder.contributionMaxLength)
    this._risk = this._validateTextField(data.risk, config.validation.stakeholder.riskMaxLength)
    this._communication = this._validateTextField(data.communication, config.validation.stakeholder.communicationMaxLength)
    this._strategy = this._validateTextField(data.strategy, config.validation.stakeholder.strategyMaxLength)
    this._measurement = this._validateTextField(data.measurement, config.validation.stakeholder.measurementMaxLength)

    // Interaction history
    this._interactions = Array.isArray(data.interactions) ? data.interactions : []

    // Metadata
    this._createdAt = data.createdAt || new Date()
    this._updatedAt = data.updatedAt || new Date()
    this._createdBy = data.createdBy || null
  }

  // Getters
  get id() { return this._id }
  get mapId() { return this._mapId }
  get name() { return this._name }
  get influence() { return this._influence }
  get impact() { return this._impact }
  get relationship() { return this._relationship }
  get category() { return this._category }
  get interests() { return this._interests }
  get contribution() { return this._contribution }
  get risk() { return this._risk }
  get communication() { return this._communication }
  get strategy() { return this._strategy }
  get measurement() { return this._measurement }
  get interactions() { return [...this._interactions] } // Return a copy to prevent direct mutation
  get createdAt() { return this._createdAt }
  get updatedAt() { return this._updatedAt }
  get createdBy() { return this._createdBy }

  // Calculate quadrant based on influence and impact
  get quadrant() {
    const highThreshold = 7

    if (this._influence >= highThreshold && this._impact >= highThreshold) {
      return 'manage-closely'
    } else if (this._influence >= highThreshold && this._impact < highThreshold) {
      return 'keep-satisfied'
    } else if (this._influence < highThreshold && this._impact >= highThreshold) {
      return 'keep-informed'
    } else {
      return 'monitor'
    }
  }

  // Setters with validation
  set name(value) {
    this._name = value || ''
    this._markUpdated()
  }

  set influence(value) {
    this._influence = this._validateNumericRange(value, 1, 10, this._influence)
    this._markUpdated()
  }

  set impact(value) {
    this._impact = this._validateNumericRange(value, 1, 10, this._impact)
    this._markUpdated()
  }

  set relationship(value) {
    this._relationship = this._validateNumericRange(value, 1, 10, this._relationship)
    this._markUpdated()
  }

  set category(value) {
    this._category = this._validateCategory(value)
    this._markUpdated()
  }

  set interests(value) {
    this._interests = this._validateTextField(value, config.validation.stakeholder.interestsMaxLength)
    this._markUpdated()
  }

  set contribution(value) {
    this._contribution = this._validateTextField(value, config.validation.stakeholder.contributionMaxLength)
    this._markUpdated()
  }

  set risk(value) {
    this._risk = this._validateTextField(value, config.validation.stakeholder.riskMaxLength)
    this._markUpdated()
  }

  set communication(value) {
    this._communication = this._validateTextField(value, config.validation.stakeholder.communicationMaxLength)
    this._markUpdated()
  }

  set strategy(value) {
    this._strategy = this._validateTextField(value, config.validation.stakeholder.strategyMaxLength)
    this._markUpdated()
  }

  set measurement(value) {
    this._measurement = this._validateTextField(value, config.validation.stakeholder.measurementMaxLength)
    this._markUpdated()
  }

  /**
   * Add an interaction to this stakeholder
   * @param {Object} interaction - The interaction to add
   */
  addInteraction(interaction) {
    const newInteraction = {
      id: interaction.id || uuidv4(),
      date: interaction.date || new Date(),
      type: interaction.type || 'other',
      notes: interaction.notes || '',
      createdAt: interaction.createdAt || new Date(),
      createdBy: interaction.createdBy || null
    }

    this._interactions.push(newInteraction)
    this._markUpdated()

    return newInteraction
  }

  /**
   * Remove an interaction by ID
   * @param {string} interactionId - The ID of the interaction to remove
   * @returns {boolean} Whether the interaction was removed
   */
  removeInteraction(interactionId) {
    const initialLength = this._interactions.length
    this._interactions = this._interactions.filter(i => i.id !== interactionId)

    if (this._interactions.length !== initialLength) {
      this._markUpdated()
      return true
    }

    return false
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain JavaScript object
   */
  toObject() {
    return {
      id: this._id,
      mapId: this._mapId,
      name: this._name,
      influence: this._influence,
      impact: this._impact,
      relationship: this._relationship,
      category: this._category,
      interests: this._interests,
      contribution: this._contribution,
      risk: this._risk,
      communication: this._communication,
      strategy: this._strategy,
      measurement: this._measurement,
      interactions: [...this._interactions],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      createdBy: this._createdBy
    }
  }

  /**
   * Create a Stakeholder instance from a plain object
   * @param {Object} data - Plain JavaScript object
   * @returns {Stakeholder} New Stakeholder instance
   */
  static fromObject(data) {
    return new Stakeholder(data)
  }

  /**
   * Create a new default stakeholder
   * @param {string} mapId - The ID of the map this stakeholder belongs to
   * @returns {Stakeholder} New Stakeholder instance with default values
   */
  static createDefault(mapId) {
    const defaults = config.defaults.stakeholder
    return new Stakeholder({
      ...defaults,
      mapId
    })
  }

  /**
   * Validate and normalize a numeric value within a range
   * @param {number|string} value - The value to validate
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @param {number} defaultValue - Default value if validation fails
   * @returns {number} Validated and normalized value
   * @private
   */
  _validateNumericRange(value, min, max, defaultValue) {
    // Convert to number if string
    const numValue = typeof value === 'string' ? parseFloat(value) : value

    // Check if valid number and in range
    if (isNaN(numValue) || numValue < min || numValue > max) {
      return defaultValue
    }

    // Round to nearest integer (for ratings)
    return Math.round(numValue)
  }

  /**
   * Validate stakeholder category
   * @param {string} category - Category to validate
   * @returns {string} Validated category
   * @private
   */
  _validateCategory(category) {
    const validCategories = [
      'internal',
      'external',
      'customer',
      'supplier',
      'regulator',
      'partner',
      'community',
      'investor',
      'employee',
      'other'
    ]

    return validCategories.includes(category) ? category : 'other'
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
   * Mark the stakeholder as updated
   * @private
   */
  _markUpdated() {
    this._updatedAt = new Date()
  }
}

export default Stakeholder 