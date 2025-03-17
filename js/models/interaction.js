/**
 * Interaction Model - Represents an interaction with a stakeholder
 */
export class Interaction {
  /**
   * Create a new Interaction
   * @param {Object} data - Interaction data
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.date = data.date || new Date().toISOString();
    this.text = data.text || '';
    this.stakeholderId = data.stakeholderId || null;
    this.createdBy = data.createdBy || null; // User ID who created this
  }
  
  /**
   * Generate a unique ID for a new interaction
   * @returns {string} - Unique ID
   * @private
   */
  _generateId() {
    return 'interaction_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Get formatted date string
   * @param {string} [format='full'] - Format type ('full', 'date', 'time')
   * @returns {string} - Formatted date string
   */
  getFormattedDate(format = 'full') {
    const date = new Date(this.date);
    
    switch (format) {
      case 'date':
        return date.toLocaleDateString();
      case 'time':
        return date.toLocaleTimeString();
      case 'full':
      default:
        return date.toLocaleString();
    }
  }
  
  /**
   * Get the time elapsed since the interaction
   * @returns {string} - Elapsed time string (e.g., '2 days ago')
   */
  getTimeElapsed() {
    const now = new Date();
    const interactionDate = new Date(this.date);
    const diffMs = now - interactionDate;
    
    // Convert to seconds, minutes, hours, days
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffHrs > 0) {
      return diffHrs === 1 ? '1 hour ago' : `${diffHrs} hours ago`;
    } else if (diffMin > 0) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else {
      return 'Just now';
    }
  }
  
  /**
   * Get the first few words of the interaction text
   * @param {number} [wordCount=10] - Number of words to return
   * @returns {string} - Truncated text with ellipsis if needed
   */
  getPreview(wordCount = 10) {
    if (!this.text) return '';
    
    const words = this.text.split(/\s+/);
    if (words.length <= wordCount) return this.text;
    
    return words.slice(0, wordCount).join(' ') + '...';
  }
  
  /**
   * Update the interaction text
   * @param {string} text - New interaction text
   */
  updateText(text) {
    this.text = text;
    // Note: We don't update the date since we're preserving the original interaction time
  }
  
  /**
   * Convert interaction to a plain object
   * @returns {Object} - Plain JavaScript object representation
   */
  toObject() {
    return {
      id: this.id,
      date: this.date,
      text: this.text,
      stakeholderId: this.stakeholderId,
      createdBy: this.createdBy
    };
  }
  
  /**
   * Create an Interaction instance from a plain object
   * @param {Object} data - Plain object representation
   * @returns {Interaction} - New Interaction instance
   */
  static fromObject(data) {
    return new Interaction(data);
  }
}
