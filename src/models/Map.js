/**
 * @typedef {Object} MapData
 * @property {string} id - Unique identifier
 * @property {string} name - Map name
 * @property {string} [description] - Optional map description
 * @property {number} stakeholderCount - Number of stakeholders
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} lastUpdated - Last update timestamp
 * @property {string} [userId] - Optional user ID for authenticated maps
 */

/**
 * Map model class
 */
export class Map {
  /** @private */
  _id;
  /** @private */
  _name;
  /** @private */
  _description;
  /** @private */
  _stakeholderCount;
  /** @private */
  _createdAt;
  /** @private */
  _lastUpdated;
  /** @private */
  _userId;

  /**
   * Create a new Map instance
   * @param {MapData} data - Map data
   */
  constructor(data = {}) {
    this._id = data.id || crypto.randomUUID()
    this._name = data.name || 'New Map'
    this._description = data.description || ''
    this._stakeholderCount = data.stakeholderCount || 0
    this._createdAt = data.createdAt ? new Date(data.createdAt) : new Date()
    this._lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : new Date()
    this._userId = data.userId || null
  }

  // Getters
  get id() { return this._id }
  get name() { return this._name }
  get description() { return this._description }
  get stakeholderCount() { return this._stakeholderCount }
  get createdAt() { return this._createdAt }
  get lastUpdated() { return this._lastUpdated }
  get userId() { return this._userId }

  // Setters with validation
  set name(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('Name must be a non-empty string')
    }
    this._name = value
    this._updateTimestamp()
  }

  set description(value) {
    if (value && typeof value !== 'string') {
      throw new Error('Description must be a string')
    }
    this._description = value || ''
    this._updateTimestamp()
  }

  set stakeholderCount(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Stakeholder count must be a non-negative integer')
    }
    this._stakeholderCount = value
    this._updateTimestamp()
  }

  /**
   * Update the last updated timestamp
   * @private
   */
  _updateTimestamp() {
    this._lastUpdated = new Date()
  }

  /**
   * Convert the map to a plain object
   * @returns {MapData}
   */
  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      stakeholderCount: this._stakeholderCount,
      createdAt: this._createdAt,
      lastUpdated: this._lastUpdated,
      userId: this._userId
    }
  }

  /**
   * Create a Map instance from JSON data
   * @param {MapData} json
   * @returns {Map}
   */
  static fromJSON(json) {
    return new Map(json)
  }
}
