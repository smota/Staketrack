import { EventBus } from '../utils/eventBus.js';
import dataService from '../services/dataService.js';
import { dateUtils } from '../utils/dateUtils.js';
import { analytics } from '../../../firebase/firebaseConfig.js';

/**
 * Interaction Log Component - Manages the interaction log for a stakeholder
 */
export class InteractionLog {
  /**
   * Create a new InteractionLog
   * @param {HTMLElement} container - Container element to render the log in
   * @param {string} stakeholderId - ID of the stakeholder
   * @param {Function} onCloseCallback - Callback to execute when closing the log
   */
  constructor(container, stakeholderId, onCloseCallback = null) {
    this.container = container;
    this.stakeholderId = stakeholderId;
    this.onCloseCallback = onCloseCallback;
    this.stakeholder = null;
    
    this._init();
  }
  
  /**
   * Initialize the interaction log
   * @private
   */
  async _init() {
    // Get stakeholder data
    this.stakeholder = dataService.getStakeholderById(this.stakeholderId);
    if (!this.stakeholder) {
      console.error(`Stakeholder not found: ${this.stakeholderId}`);
      return;
    }
    
    this.render();
    this._addEventListeners();
    
    // Track view
    analytics.logEvent('interaction_log_viewed', {
      stakeholder_id: this.stakeholderId,
      stakeholder_name: this.stakeholder.name,
      interactions_count: this.stakeholder.interactions.length
    });
  }
  
  /**
   * Render the interaction log
   */
  render() {
    // Get the template
    const template = document.getElementById('interaction-log-template');
    if (!template) {
      console.error('Interaction log template not found');
      return;
    }
    
    // Clone the template
    const logContent = template.content.cloneNode(true);
    
    // Clear container and append log
    this.container.innerHTML = '';
    this.container.appendChild(logContent);
    
    // Set stakeholder name
    document.getElementById('interaction-stakeholder-name').textContent = this.stakeholder.name;
    
    // Render interactions list
    this._renderInteractionsList();
  }
  
  /**
   * Render the interactions list
   * @private
   */
  _renderInteractionsList() {
    const interactionsList = document.getElementById('interactions-list');
    if (!interactionsList) return;
    
    interactionsList.innerHTML = '';
    
    const interactions = this.stakeholder.getLatestInteractions();
    
    if (interactions.length === 0) {
      interactionsList.innerHTML = '<p class="empty-state">No interactions recorded yet.</p>';
      return;
    }
    
    interactions.forEach(interaction => {
      const entryElement = document.createElement('div');
      entryElement.className = 'interaction-entry';
      
      const date = new Date(interaction.date);
      const formattedDate = dateUtils.formatDate(date, 'full');
      
      entryElement.innerHTML = `
        <div class="interaction-date">${formattedDate}</div>
        <p class="interaction-text">${this._formatInteractionText(interaction.text)}</p>
      `;
      
      interactionsList.appendChild(entryElement);
    });
  }
  
  /**
   * Format interaction text with line breaks
   * @param {string} text - Raw interaction text
   * @returns {string} - Formatted HTML
   * @private
   */
  _formatInteractionText(text) {
    if (!text) return '';
    
    // Convert line breaks to <br> tags
    return text.replace(/\n/g, '<br>');
  }
  
  /**
   * Add event listeners
   * @private
   */
  _addEventListeners() {
    // Add interaction button
    const addInteractionBtn = document.getElementById('add-interaction-btn');
    if (addInteractionBtn) {
      addInteractionBtn.addEventListener('click', () => {
        this._addInteraction();
      });
    }
    
    // New interaction textarea (allow Ctrl+Enter to submit)
    const newInteractionTextarea = document.getElementById('new-interaction');
    if (newInteractionTextarea) {
      newInteractionTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          this._addInteraction();
        }
      });
    }
  }
  
  /**
   * Add a new interaction
   * @private
   */
  async _addInteraction() {
    const textarea = document.getElementById('new-interaction');
    if (!textarea) return;
    
    const text = textarea.value.trim();
    if (!text) {
      alert('Please enter some text for the interaction.');
      return;
    }
    
    try {
      // Add the interaction
      await dataService.addInteraction(this.stakeholderId, text);
      
      // Clear the textarea
      textarea.value = '';
      
      // Re-render the interactions list
      this._renderInteractionsList();
      
      // Track event
      analytics.logEvent('interaction_added', {
        stakeholder_id: this.stakeholderId,
        stakeholder_name: this.stakeholder.name,
        interaction_length: text.length
      });
    } catch (error) {
      console.error('Error adding interaction:', error);
      alert(`Error adding interaction: ${error.message}`);
    }
  }
  
  /**
   * Close the interaction log
   */
  close() {
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }
}
