import { EventBus } from '../utils/eventBus.js';
// Replace direct import with window reference
// import { analytics } from '../../../firebase/firebaseConfig.js';

/**
 * Stakeholder Card Component - Renders a stakeholder card in the list view
 */
export class StakeholderCard {
  /**
   * Create a new StakeholderCard
   * @param {Stakeholder} stakeholder - Stakeholder data
   * @param {HTMLElement} container - Container element to append the card to
   */
  constructor(stakeholder, container) {
    this.stakeholder = stakeholder;
    this.container = container;
    this.element = null;

    // Get analytics from window
    this.analytics = window.firebaseAnalytics;

    this.render();
    this._addEventListeners();
  }

  /**
   * Render the stakeholder card
   */
  render() {
    const relationshipQuality = this.stakeholder.getRelationshipQuality() || 'medium';
    const quadrant = this.stakeholder.getQuadrant() || 0;

    // Create card element
    const card = document.createElement('div');
    card.className = 'stakeholder-card card card-interactive mb-3';
    card.dataset.id = this.stakeholder.id;

    // Create card content
    card.innerHTML = `
      <div class="card-content">
        <div class="stakeholder-card-header">
          <div class="stakeholder-initials relationship-${relationshipQuality}">
            ${this._getInitials(this.stakeholder.name)}
          </div>
          <div class="stakeholder-name">${this.stakeholder.name}</div>
        </div>
        <div class="stakeholder-metrics">
          <div class="metric-card">
            <div class="metric-label">Influence</div>
            <div class="metric-value">${this.stakeholder.influence || '-'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impact</div>
            <div class="metric-value">${this.stakeholder.impact || '-'}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Relationship</div>
            <div class="metric-value">${this.stakeholder.relationship || '-'}</div>
          </div>
        </div>
        <div class="stakeholder-category">
          ${this._formatCategory(this.stakeholder.category)}
        </div>
        ${this._getQuadrantLabel(quadrant)}
        <div class="stakeholder-actions mt-3">
          <button class="btn btn-sm btn-primary view-details-btn">View Details</button>
          <button class="btn btn-sm btn-secondary log-interaction-btn">Log Interaction</button>
        </div>
      </div>
    `;

    // Append to container
    this.container.appendChild(card);
    this.element = card;
  }

  /**
   * Add event listeners to the card
   * @private
   */
  _addEventListeners() {
    if (!this.element) return;

    // Card click
    this.element.addEventListener('click', (e) => {
      // If click was on a button, don't trigger card click
      if (e.target.closest('button')) return;

      this._showDetails();
    });

    // View details button
    const viewDetailsBtn = this.element.querySelector('.view-details-btn');
    if (viewDetailsBtn) {
      viewDetailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showDetails();
      });
    }

    // Log interaction button
    const logInteractionBtn = this.element.querySelector('.log-interaction-btn');
    if (logInteractionBtn) {
      logInteractionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showInteractionLog();
      });
    }
  }

  /**
   * Show stakeholder details
   * @private
   */
  _showDetails() {
    EventBus.emit('stakeholder:show-details', this.stakeholder.id);

    this.analytics.logEvent('stakeholder_card_clicked', {
      stakeholder_id: this.stakeholder.id,
      stakeholder_name: this.stakeholder.name
    });
  }

  /**
   * Show interaction log
   * @private
   */
  _showInteractionLog() {
    EventBus.emit('stakeholder:show-interaction-log', this.stakeholder.id);

    this.analytics.logEvent('interaction_log_button_clicked', {
      stakeholder_id: this.stakeholder.id,
      stakeholder_name: this.stakeholder.name
    });
  }

  /**
   * Get initials from a name
   * @param {string} name - Full name
   * @returns {string} - Initials (up to 2 characters)
   * @private
   */
  _getInitials(name) {
    if (!name) return '?';

    const parts = name.split(/[\s-]+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    } else {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
  }

  /**
   * Format category for display
   * @param {string} category - Category slug
   * @returns {string} - Formatted category HTML
   * @private
   */
  _formatCategory(category) {
    if (!category) return '';

    const formatted = category
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    return `<div class="stakeholder-category-badge">${formatted}</div>`;
  }

  /**
   * Get quadrant label HTML
   * @param {number} quadrant - Quadrant number (1-4)
   * @returns {string} - Quadrant label HTML
   * @private
   */
  _getQuadrantLabel(quadrant) {
    if (!quadrant) return '';

    const quadrantLabels = {
      1: 'Key Player',
      2: 'Meet Their Needs',
      3: 'Show Consideration',
      4: 'Keep Satisfied'
    };

    const label = quadrantLabels[quadrant] || '';

    return `
      <div class="stakeholder-quadrant">
        <span class="quadrant-label">Quadrant ${quadrant}: ${label}</span>
      </div>
    `;
  }

  /**
   * Update the card with new stakeholder data
   * @param {Stakeholder} stakeholder - Updated stakeholder data
   */
  update(stakeholder) {
    this.stakeholder = stakeholder;

    // Re-render the card
    if (this.element) {
      this.element.remove();
    }

    this.render();
    this._addEventListeners();
  }

  /**
   * Remove the card from the DOM
   */
  remove() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
