/**
 * Map Model - Represents a stakeholder map with metadata
 */
export class StakeholderMap {
  /**
   * Create a new StakeholderMap
   * @param {Object} data - Map data
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || 'Untitled Map';
    this.description = data.description || '';
    this.created = data.created || new Date().toISOString();
    this.updated = data.updated || new Date().toISOString();
    this.ownerId = data.ownerId || null; // Will be null for anonymous users
    this.stakeholders = []; // Will be populated separately
  }

  /**
   * Generate a unique ID for a new map
   * @returns {string} - Unique ID
   * @private
   */
  _generateId() {
    return 'map_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Update the map properties
   * @param {Object} data - New map data
   */
  update(data) {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    this.updated = new Date().toISOString();
  }

  /**
   * Add a stakeholder to the map
   * @param {Stakeholder} stakeholder - Stakeholder to add
   */
  addStakeholder(stakeholder) {
    stakeholder.mapId = this.id;
    this.stakeholders.push(stakeholder);
    this.updated = new Date().toISOString();
  }

  /**
   * Remove a stakeholder from the map
   * @param {string} stakeholderId - ID of stakeholder to remove
   * @returns {boolean} - True if successfully removed, false if not found
   */
  removeStakeholder(stakeholderId) {
    const initialLength = this.stakeholders.length;
    this.stakeholders = this.stakeholders.filter(s => s.id !== stakeholderId);

    if (this.stakeholders.length !== initialLength) {
      this.updated = new Date().toISOString();
      return true;
    }

    return false;
  }

  /**
   * Get a stakeholder by ID
   * @param {string} stakeholderId - ID of stakeholder to find
   * @returns {Stakeholder|null} - Stakeholder object if found, null otherwise
   */
  getStakeholder(stakeholderId) {
    return this.stakeholders.find(s => s.id === stakeholderId) || null;
  }

  /**
   * Get stakeholders grouped by quadrant
   * @returns {Object} - Object with stakeholders grouped by quadrant
   */
  getStakeholdersByQuadrant() {
    const result = {
      q1: [],
      q2: [],
      q3: [],
      q4: []
    };

    this.stakeholders.forEach(stakeholder => {
      const quadrant = stakeholder.getQuadrant();
      if (quadrant) {
        result[`q${quadrant}`].push(stakeholder);
      }
    });

    return result;
  }

  /**
   * Get stakeholders by category
   * @returns {Object} - Object with stakeholders grouped by category
   */
  getStakeholdersByCategory() {
    const result = {};

    this.stakeholders.forEach(stakeholder => {
      const category = stakeholder.category || 'other';
      if (!result[category]) {
        result[category] = [];
      }
      result[category].push(stakeholder);
    });

    return result;
  }

  /**
   * Get statistics about the map
   * @returns {Object} - Object with map statistics
   */
  getStatistics() {
    const stakeholdersCount = this.stakeholders.length;
    const byQuadrant = this.getStakeholdersByQuadrant();
    const byCategory = this.getStakeholdersByCategory();

    // Calculate average relationship quality
    let totalRelationship = 0;
    let relationshipCount = 0;
    this.stakeholders.forEach(stakeholder => {
      if (stakeholder.relationship) {
        totalRelationship += stakeholder.relationship;
        relationshipCount++;
      }
    });

    const avgRelationship = relationshipCount > 0
      ? (totalRelationship / relationshipCount).toFixed(1)
      : 0;

    // Count stakeholders by relationship quality
    const relationshipCounts = {
      strong: 0,
      medium: 0,
      weak: 0
    };

    this.stakeholders.forEach(stakeholder => {
      const quality = stakeholder.getRelationshipQuality();
      if (quality) {
        relationshipCounts[quality]++;
      }
    });

    return {
      stakeholdersCount,
      quadrantCounts: {
        q1: byQuadrant.q1.length,
        q2: byQuadrant.q2.length,
        q3: byQuadrant.q3.length,
        q4: byQuadrant.q4.length
      },
      categories: Object.keys(byCategory).map(category => ({
        name: category,
        count: byCategory[category].length
      })),
      avgRelationship,
      relationshipCounts
    };
  }

  /**
   * Generates an LLM-friendly context for map-level operations
   * @param {number} interactionLimit - Number of interactions to include per stakeholder
   * @returns {string} - Formatted string representation for LLM context
   */
  toLLMContext(interactionLimit = 3) {
    const stats = this.getStatistics();

    let context = `STAKEHOLDER MAP: ${this.name}\n`;
    if (this.description) context += `Description: ${this.description}\n`;
    context += `\nSTATISTICS:\n`;
    context += `- Total Stakeholders: ${stats.stakeholdersCount}\n`;
    context += `- Average Relationship Quality: ${stats.avgRelationship}/10\n`;
    context += `- Key Players (Q1): ${stats.quadrantCounts.q1}\n`;
    context += `- Meet Their Needs (Q2): ${stats.quadrantCounts.q2}\n`;
    context += `- Show Consideration (Q3): ${stats.quadrantCounts.q3}\n`;
    context += `- Keep Satisfied (Q4): ${stats.quadrantCounts.q4}\n\n`;

    context += `STAKEHOLDERS:\n\n`;

    // Sort stakeholders by quadrant priority (Q1, Q4, Q2, Q3)
    const sortedStakeholders = [...this.stakeholders].sort((a, b) => {
      const quadrantPriority = { 1: 0, 4: 1, 2: 2, 3: 3 };
      const aQuadrant = a.getQuadrant() || 3;
      const bQuadrant = b.getQuadrant() || 3;

      return quadrantPriority[aQuadrant] - quadrantPriority[bQuadrant];
    });

    sortedStakeholders.forEach(stakeholder => {
      context += stakeholder.toLLMContext(interactionLimit) + '\n---\n\n';
    });

    return context;
  }

  /**
   * Convert map to a plain object without stakeholders
   * @returns {Object} - Plain JavaScript object representation
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      created: this.created,
      updated: this.updated,
      ownerId: this.ownerId
    };
  }

  /**
   * Create a StakeholderMap instance from a plain object
   * @param {Object} data - Plain object representation
   * @returns {StakeholderMap} - New StakeholderMap instance
   */
  static fromObject(data) {
    return new StakeholderMap(data);
  }
}