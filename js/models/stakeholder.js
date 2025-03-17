/**
 * Stakeholder Model - Represents a stakeholder entity with all of its attributes
 */
export class Stakeholder {
  /**
   * Create a new Stakeholder
   * @param {Object} data - Stakeholder data
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || '';
    this.influence = data.influence ? parseInt(data.influence) : null;
    this.impact = data.impact ? parseInt(data.impact) : null;
    this.relationship = data.relationship ? parseInt(data.relationship) : null;
    this.interests = data.interests || '';
    this.contribution = data.contribution || '';
    this.risk = data.risk || '';
    this.communication = data.communication || '';
    this.strategy = data.strategy || '';
    this.measurement = data.measurement || '';
    this.category = data.category || 'other';
    this.interactions = data.interactions || [];
    this.created = data.created || new Date().toISOString();
    this.updated = data.updated || new Date().toISOString();
    this.mapId = data.mapId || null;
  }

  /**
   * Generate a unique ID for a new stakeholder
   * @returns {string} - Unique ID
   * @private
   */
  _generateId() {
    return 'stakeholder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get the relationship quality category based on the relationship score
   * @returns {string} - Relationship quality category ('strong', 'medium', 'weak')
   */
  getRelationshipQuality() {
    if (!this.relationship) return null;
    
    if (this.relationship >= 7) {
      return 'strong';
    } else if (this.relationship >= 4) {
      return 'medium';
    } else {
      return 'weak';
    }
  }

  /**
   * Get the quadrant position based on influence and impact
   * @returns {number} - Quadrant number (1, 2, 3, or 4)
   */
  getQuadrant() {
    if (!this.influence || !this.impact) return null;
    
    // Q1: High Impact, High Influence
    if (this.impact >= 6 && this.influence >= 6) {
      return 1;
    }
    // Q2: High Impact, Low Influence
    else if (this.impact >= 6 && this.influence < 6) {
      return 2;
    }
    // Q3: Low Impact, Low Influence
    else if (this.impact < 6 && this.influence < 6) {
      return 3;
    }
    // Q4: Low Impact, High Influence
    else {
      return 4;
    }
  }

  /**
   * Get the position coordinates for the matrix plot
   * @returns {Object} - x and y coordinates (0-100)
   */
  getPlotPosition() {
    if (!this.influence || !this.impact) return null;
    
    // Calculate percentage positions for the matrix (0-100)
    const x = ((this.influence - 1) / 9) * 100;
    const y = 100 - ((this.impact - 1) / 9) * 100;
    
    return { x, y };
  }

  /**
   * Add a new interaction to the stakeholder
   * @param {string} text - Interaction text
   * @returns {Object} - The newly created interaction
   */
  addInteraction(text) {
    const interaction = {
      id: 'interaction_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      text: text
    };
    
    this.interactions.unshift(interaction);
    this.updated = new Date().toISOString();
    
    return interaction;
  }

  /**
   * Get the latest interactions, sorted by date
   * @param {number} limit - Maximum number of interactions to return
   * @returns {Array} - Array of interaction objects
   */
  getLatestInteractions(limit = 0) {
    const sorted = [...this.interactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return limit > 0 ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Update the stakeholder properties
   * @param {Object} data - New stakeholder data
   */
  update(data) {
    if (data.name !== undefined) this.name = data.name;
    if (data.influence !== undefined) this.influence = parseInt(data.influence);
    if (data.impact !== undefined) this.impact = parseInt(data.impact);
    if (data.relationship !== undefined) this.relationship = parseInt(data.relationship);
    if (data.interests !== undefined) this.interests = data.interests;
    if (data.contribution !== undefined) this.contribution = data.contribution;
    if (data.risk !== undefined) this.risk = data.risk;
    if (data.communication !== undefined) this.communication = data.communication;
    if (data.strategy !== undefined) this.strategy = data.strategy;
    if (data.measurement !== undefined) this.measurement = data.measurement;
    if (data.category !== undefined) this.category = data.category;
    
    this.updated = new Date().toISOString();
  }

  /**
   * Convert stakeholder to a plain object
   * @returns {Object} - Plain JavaScript object representation
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      influence: this.influence,
      impact: this.impact,
      relationship: this.relationship,
      interests: this.interests,
      contribution: this.contribution,
      risk: this.risk,
      communication: this.communication,
      strategy: this.strategy,
      measurement: this.measurement,
      category: this.category,
      interactions: this.interactions,
      created: this.created,
      updated: this.updated,
      mapId: this.mapId
    };
  }
  
  /**
   * Creates an LLM-friendly representation of the stakeholder
   * @param {number} interactionLimit - Number of interactions to include
   * @returns {string} - Formatted string representation for LLM context
   */
  toLLMContext(interactionLimit = 3) {
    const latestInteractions = this.getLatestInteractions(interactionLimit);
    
    let context = `STAKEHOLDER: ${this.name}\n`;
    context += `Category: ${this.category}\n`;
    context += `Influence Level (1-10): ${this.influence}\n`;
    context += `Impact Level (1-10): ${this.impact}\n`;
    context += `Relationship Quality (1-10): ${this.relationship}\n\n`;
    
    if (this.interests) context += `Primary Interests: ${this.interests}\n\n`;
    if (this.contribution) context += `Potential Contribution: ${this.contribution}\n\n`;
    if (this.risk) context += `Risk if Disengaged: ${this.risk}\n\n`;
    if (this.communication) context += `Communication Style Preferences: ${this.communication}\n\n`;
    if (this.strategy) context += `Engagement Strategy: ${this.strategy}\n\n`;
    if (this.measurement) context += `Measurement Approach: ${this.measurement}\n\n`;
    
    if (latestInteractions.length > 0) {
      context += `Recent Interactions:\n`;
      latestInteractions.forEach(interaction => {
        const date = new Date(interaction.date).toLocaleDateString();
        context += `- [${date}]: ${interaction.text}\n`;
      });
    } else {
      context += 'No recent interactions recorded.\n';
    }
    
    return context;
  }

  /**
   * Create a Stakeholder instance from a plain object
   * @param {Object} data - Plain object representation
   * @returns {Stakeholder} - New Stakeholder instance
   */
  static fromObject(data) {
    return new Stakeholder(data);
  }
}
