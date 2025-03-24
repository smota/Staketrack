import { EventBus } from '../utils/eventBus.js';
import dataService from '../services/dataService.js';
import llmService from '../services/llmService.js';
import { stakeholderService } from '../services/stakeholderService.js';
import { analyticsService } from '../services/analyticsService.js';
// import { analytics } from '../../firebase/firebaseConfig.js';

/**
 * Stakeholder Controller - Manages stakeholder-related operations
 */
export class StakeholderController {
  constructor() {
    this.modal = document.getElementById('modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalContent = document.getElementById('modal-content');
    this.modalContainer = document.getElementById('modal-container');
    this.modalClose = document.getElementById('modal-close');

    this.stakeholderFormTemplate = document.getElementById('stakeholder-form-template');
    this.interactionLogTemplate = document.getElementById('interaction-log-template');
    this.stakeholderAdviceTemplate = document.getElementById('stakeholder-advice-template');

    this.currentStakeholderId = null;

    // Get analytics from window
    this.analytics = window.firebaseAnalytics;

    this.initialized = false;
    this.setupEventListeners();
  }

  /**
   * Initialize the controller
   */
  init() {
    if (this.initialized) return;

    try {
      // Listen for stakeholder events
      EventBus.on('stakeholder:show-form', this.handleShowForm.bind(this));
      EventBus.on('stakeholder:submit', this.handleSubmit.bind(this));
      EventBus.on('stakeholder:delete', this.handleDelete.bind(this));
      EventBus.on('stakeholder:update', this.handleUpdate.bind(this));

      this.initialized = true;
      console.log('StakeholderController initialized');
    } catch (error) {
      console.error('Failed to initialize StakeholderController:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Form submission handler
    const form = document.getElementById('stakeholder-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const stakeholderData = Object.fromEntries(formData.entries());
        EventBus.emit('stakeholder:submit', stakeholderData);
      });
    }

    // Add stakeholder button
    document.getElementById('add-stakeholder-btn').addEventListener('click', () => {
      this.showStakeholderForm();

      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('add_stakeholder_clicked');
      }
    });

    // Modal close button
    this.modalClose.addEventListener('click', () => {
      this.hideModal();
    });

    // Close modal when clicking outside
    this.modalContainer.addEventListener('click', (e) => {
      if (e.target === this.modalContainer) {
        this.hideModal();
      }
    });

    // Show stakeholder details
    EventBus.on('stakeholder:show-details', (stakeholderId) => {
      this.showStakeholderDetails(stakeholderId);
    });

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalContainer.classList.contains('hidden')) {
        this.hideModal();
      }
    });
  }

  /**
   * Show the stakeholder form modal
   * @param {string} [stakeholderId] - Stakeholder ID to edit, or null for new stakeholder
   */
  async handleShowForm(stakeholder = null) {
    try {
      const form = document.getElementById('stakeholder-form');
      if (!form) return;

      // Reset form
      form.reset();

      if (stakeholder) {
        // Populate form with stakeholder data
        Object.entries(stakeholder).forEach(([key, value]) => {
          const input = form.elements[key];
          if (input) {
            input.value = value;
          }
        });
      }

      // Show form
      form.classList.remove('hidden');
    } catch (error) {
      console.error('Error showing stakeholder form:', error);
      this.showError('Failed to show stakeholder form');
    }
  }

  async handleSubmit(stakeholderData) {
    try {
      const form = document.getElementById('stakeholder-form');
      if (!form) return;

      // Add or update stakeholder
      const stakeholder = stakeholderData.id
        ? await stakeholderService.updateStakeholder(stakeholderData.id, stakeholderData)
        : await stakeholderService.addStakeholder(stakeholderData);

      // Log analytics event
      analyticsService.logEvent('stakeholder_saved', {
        stakeholder_id: stakeholder.id,
        action: stakeholderData.id ? 'update' : 'create'
      });

      // Hide form
      form.classList.add('hidden');

      // Show success message
      this.showSuccess('Stakeholder saved successfully');
    } catch (error) {
      console.error('Error saving stakeholder:', error);
      this.showError('Failed to save stakeholder');
    }
  }

  async handleDelete(stakeholderId) {
    try {
      await stakeholderService.deleteStakeholder(stakeholderId);

      // Log analytics event
      analyticsService.logEvent('stakeholder_deleted', {
        stakeholder_id: stakeholderId
      });

      this.showSuccess('Stakeholder deleted successfully');
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
      this.showError('Failed to delete stakeholder');
    }
  }

  async handleUpdate(stakeholder) {
    try {
      await stakeholderService.updateStakeholder(stakeholder.id, stakeholder);

      // Log analytics event
      analyticsService.logEvent('stakeholder_updated', {
        stakeholder_id: stakeholder.id
      });

      this.showSuccess('Stakeholder updated successfully');
    } catch (error) {
      console.error('Error updating stakeholder:', error);
      this.showError('Failed to update stakeholder');
    }
  }

  showSuccess(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.remove('hidden', 'error');
      toast.classList.add('success');
      setTimeout(() => toast.classList.add('hidden'), 3000);
    }
  }

  showError(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.remove('hidden', 'success');
      toast.classList.add('error');
      setTimeout(() => toast.classList.add('hidden'), 3000);
    }
  }

  /**
   * Show stakeholder details
   * @param {string} stakeholderId - Stakeholder ID
   */
  showStakeholderDetails(stakeholderId) {
    const currentMap = dataService.getCurrentMap();
    if (!currentMap) {
      console.error('No current map available');
      return;
    }

    const stakeholder = currentMap.getStakeholder(stakeholderId);
    if (!stakeholder) {
      console.error(`Stakeholder not found: ${stakeholderId}`);
      return;
    }

    this.currentStakeholderId = stakeholderId;

    // Set modal title
    this.modalTitle.textContent = stakeholder.name;

    // Create details content
    const detailsContent = document.createElement('div');
    detailsContent.className = 'stakeholder-details';

    // Add details HTML
    detailsContent.innerHTML = `
      <div class="stakeholder-info">
        <div class="stakeholder-metrics">
          <div class="metric-card">
            <div class="metric-label">Influence</div>
            <div class="metric-value">${stakeholder.influence}/10</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impact</div>
            <div class="metric-value">${stakeholder.impact}/10</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Relationship</div>
            <div class="metric-value">${stakeholder.relationship}/10</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Category</div>
            <div class="metric-value">${this._formatCategory(stakeholder.category)}</div>
          </div>
        </div>
        
        <div class="stakeholder-details-section">
          ${this._createDetailSection('Primary Interests', stakeholder.interests)}
          ${this._createDetailSection('Potential Contribution', stakeholder.contribution)}
          ${this._createDetailSection('Risk if Disengaged', stakeholder.risk)}
          ${this._createDetailSection('Communication Style', stakeholder.communication)}
          ${this._createDetailSection('Engagement Strategy', stakeholder.strategy)}
          ${this._createDetailSection('Measurement Approach', stakeholder.measurement)}
        </div>
        
        <div class="stakeholder-actions">
          <button id="edit-stakeholder-btn" class="btn btn-secondary">Edit</button>
          <button id="delete-stakeholder-btn" class="btn btn-secondary">Delete</button>
          <button id="log-interaction-btn" class="btn btn-primary">Log Interaction</button>
          <button id="get-advice-btn" class="btn btn-accent">Get Engagement Advice</button>
        </div>
      </div>
    `;

    // Clear modal content and add details
    this.modalContent.innerHTML = '';
    this.modalContent.appendChild(detailsContent);

    // Add event listeners for action buttons
    document.getElementById('edit-stakeholder-btn').addEventListener('click', () => {
      this.showStakeholderForm(stakeholderId);
    });

    document.getElementById('delete-stakeholder-btn').addEventListener('click', () => {
      this._confirmDeleteStakeholder(stakeholderId);
    });

    document.getElementById('log-interaction-btn').addEventListener('click', () => {
      this.showInteractionLog(stakeholderId);
    });

    document.getElementById('get-advice-btn').addEventListener('click', () => {
      this.getStakeholderAdvice(stakeholderId);
    });

    // Show modal
    this.showModal();

    // Track analytics
    if (this.analytics && typeof this.analytics.logEvent === 'function') {
      this.analytics.logEvent('stakeholder_details_viewed', {
        stakeholder_id: stakeholderId,
        stakeholder_name: stakeholder.name
      });
    }
  }

  /**
   * Create a detail section HTML
   * @param {string} title - Section title
   * @param {string} content - Section content
   * @returns {string} - HTML string
   * @private
   */
  _createDetailSection(title, content) {
    if (!content) return '';

    return `
      <div class="detail-section">
        <h4>${title}</h4>
        <p>${content}</p>
      </div>
    `;
  }

  /**
   * Format category for display
   * @param {string} category - Category slug
   * @returns {string} - Formatted category name
   * @private
   */
  _formatCategory(category) {
    if (!category) return 'Other';

    return category
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Confirm and delete a stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @private
   */
  _confirmDeleteStakeholder(stakeholderId) {
    const currentMap = dataService.getCurrentMap();
    if (!currentMap) {
      console.error('No current map available');
      return;
    }

    const stakeholder = currentMap.getStakeholder(stakeholderId);
    if (!stakeholder) {
      console.error(`Stakeholder not found: ${stakeholderId}`);
      return;
    }

    if (confirm(`Are you sure you want to delete "${stakeholder.name}"? This action cannot be undone.`)) {
      currentMap.deleteStakeholder(stakeholderId)
        .then(() => {
          this.hideModal();

          if (this.analytics && typeof this.analytics.logEvent === 'function') {
            this.analytics.logEvent('stakeholder_deleted', {
              stakeholder_id: stakeholderId
            });
          }
        })
        .catch(error => {
          console.error('Error deleting stakeholder:', error);
          alert(`Error deleting stakeholder: ${error.message}`);
        });
    }
  }

  /**
   * Show interaction log for a stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   */
  showInteractionLog(stakeholderId) {
    const currentMap = dataService.getCurrentMap();
    if (!currentMap) {
      console.error('No current map available');
      return;
    }

    const stakeholder = currentMap.getStakeholder(stakeholderId);
    if (!stakeholder) {
      console.error(`Stakeholder not found: ${stakeholderId}`);
      return;
    }

    this.currentStakeholderId = stakeholderId;

    // Set modal title
    this.modalTitle.textContent = `Interaction Log - ${stakeholder.name}`;

    // Clone the interaction log template
    const logContent = this.interactionLogTemplate.content.cloneNode(true);
    this.modalContent.innerHTML = '';
    this.modalContent.appendChild(logContent);

    // Set stakeholder name
    document.getElementById('interaction-stakeholder-name').textContent = stakeholder.name;

    // Populate interactions list
    this._renderInteractionsList(stakeholder);

    // Add event listener for adding new interaction
    document.getElementById('add-interaction-btn').addEventListener('click', () => {
      this._addNewInteraction(stakeholderId);
    });

    // Enter key in textarea to submit
    document.getElementById('new-interaction').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this._addNewInteraction(stakeholderId);
      }
    });

    // Show modal
    this.showModal();

    // Track analytics
    if (this.analytics && typeof this.analytics.logEvent === 'function') {
      this.analytics.logEvent('interaction_log_opened', {
        stakeholder_id: stakeholderId,
        stakeholder_name: stakeholder.name
      });
    }
  }

  /**
   * Render the interactions list for a stakeholder
   * @param {Stakeholder} stakeholder - Stakeholder object
   * @private
   */
  _renderInteractionsList(stakeholder) {
    const interactionsList = document.getElementById('interactions-list');
    interactionsList.innerHTML = '';

    const interactions = stakeholder.getLatestInteractions();

    if (interactions.length === 0) {
      interactionsList.innerHTML = '<p class="empty-state">No interactions recorded yet.</p>';
      return;
    }

    interactions.forEach(interaction => {
      const entryElement = document.createElement('div');
      entryElement.className = 'interaction-entry';

      const date = new Date(interaction.date);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

      entryElement.innerHTML = `
        <div class="interaction-date">${formattedDate}</div>
        <p class="interaction-text">${interaction.text}</p>
      `;

      interactionsList.appendChild(entryElement);
    });
  }

  /**
   * Add a new interaction for a stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @private
   */
  async _addNewInteraction(stakeholderId) {
    const textArea = document.getElementById('new-interaction');
    const text = textArea.value.trim();

    if (!text) return;

    try {
      const currentMap = dataService.getCurrentMap();
      if (!currentMap) {
        console.error('No current map available');
        return;
      }

      const stakeholder = currentMap.getStakeholder(stakeholderId);
      if (!stakeholder) {
        console.error(`Stakeholder not found: ${stakeholderId}`);
        return;
      }

      await stakeholder.addInteraction(text);

      // Clear textarea
      textArea.value = '';

      // Re-render interactions list
      this._renderInteractionsList(stakeholder);

      // Track analytics
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('interaction_added', {
          stakeholder_id: stakeholderId
        });
      }
    } catch (error) {
      console.error('Error adding interaction:', error);
      alert(`Error adding interaction: ${error.message}`);
    }
  }

  /**
   * Get AI-powered engagement advice for a stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   */
  async getStakeholderAdvice(stakeholderId) {
    const currentMap = dataService.getCurrentMap();
    if (!currentMap) {
      console.error('No current map available');
      return;
    }

    const stakeholder = currentMap.getStakeholder(stakeholderId);
    if (!stakeholder) {
      console.error(`Stakeholder not found: ${stakeholderId}`);
      return;
    }

    // Set modal title
    this.modalTitle.textContent = `Engagement Advice for ${stakeholder.name}`;

    // Clone the advice template
    const adviceContent = this.stakeholderAdviceTemplate.content.cloneNode(true);
    this.modalContent.innerHTML = '';
    this.modalContent.appendChild(adviceContent);

    // Set stakeholder name
    document.getElementById('advice-stakeholder-name').textContent = stakeholder.name;

    // Show loading state
    document.getElementById('stakeholder-advice-loading').classList.remove('hidden');
    document.getElementById('stakeholder-advice-content').classList.add('hidden');

    // Show modal
    this.showModal();

    try {
      // Get advice from LLM service
      const advice = await llmService.getStakeholderAdvice(stakeholder);

      // Hide loading, show content
      document.getElementById('stakeholder-advice-loading').classList.add('hidden');
      document.getElementById('stakeholder-advice-content').classList.remove('hidden');

      // Set advice content with markdown formatting
      const adviceContent = document.getElementById('stakeholder-advice-content');
      adviceContent.innerHTML = this._markdownToHtml(advice);

      // Track analytics
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('stakeholder_advice_generated', {
          stakeholder_id: stakeholderId,
          stakeholder_name: stakeholder.name
        });
      }
    } catch (error) {
      console.error('Error getting stakeholder advice:', error);

      // Hide loading, show error
      document.getElementById('stakeholder-advice-loading').classList.add('hidden');
      document.getElementById('stakeholder-advice-content').classList.remove('hidden');
      document.getElementById('stakeholder-advice-content').innerHTML = `
        <div class="error-message">
          <h4>Error Getting Advice</h4>
          <p>${error.message}</p>
          <p>Please check your API key settings and try again.</p>
        </div>
      `;

      // Track error
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('stakeholder_advice_error', {
          stakeholder_id: stakeholderId,
          error_message: error.message
        });
      }
    }
  }

  /**
   * Convert markdown to HTML
   * @param {string} markdown - Markdown text
   * @returns {string} - HTML string
   * @private
   */
  _markdownToHtml(markdown) {
    if (!markdown) return '';

    // Convert headers
    let html = markdown
      .replace(/^# (.*$)/gm, '<h2>$1</h2>')
      .replace(/^## (.*$)/gm, '<h3>$1</h3>')
      .replace(/^### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^#### (.*$)/gm, '<h5>$1</h5>');

    // Convert lists
    html = html
      .replace(/^\s*\n\* (.*)/gm, '<ul>\n<li>$1</li>')
      .replace(/^\* (.*)/gm, '<li>$1</li>')
      .replace(/^\s*\n- (.*)/gm, '<ul>\n<li>$1</li>')
      .replace(/^- (.*)/gm, '<li>$1</li>')
      .replace(/^\s*\n\d\. (.*)/gm, '<ol>\n<li>$1</li>')
      .replace(/^\d\. (.*)/gm, '<li>$1</li>')
      .replace(/<\/ul>\s*\n<ul>/g, '')
      .replace(/<\/ol>\s*\n<ol>/g, '')
      .replace(/<\/li>\s*\n<\/ul>/g, '</li></ul>')
      .replace(/<\/li>\s*\n<\/ol>/g, '</li></ol>');

    // Convert bold and italic
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>')
      .replace(/\_(.*?)\_/g, '<em>$1</em>');

    // Convert line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  /**
   * Show the modal
   */
  showModal() {
    this.modalContainer.classList.remove('hidden');
    setTimeout(() => {
      this.modalContainer.classList.add('visible');
    }, 10);
  }

  /**
   * Hide the modal
   */
  hideModal() {
    this.modalContainer.classList.remove('visible');
    setTimeout(() => {
      this.modalContainer.classList.add('hidden');
      this.modalContent.innerHTML = '';
      this.currentStakeholderId = null;
    }, 300); // Wait for transition to complete
  }
}

// Singleton instance
export default new StakeholderController();
