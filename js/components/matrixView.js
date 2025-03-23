import { EventBus } from '../utils/eventBus.js';
import tooltipService from '../services/tooltipService.js';
import dataService from '../services/dataService.js';
// Replace direct import with window reference
// import { analytics } from '../../../firebase/firebaseConfig.js';

/**
 * Matrix View Component - Handles the stakeholder influence-impact matrix visualization
 */
export class MatrixView {
  constructor() {
    this.matrixElement = document.getElementById('matrix');
    this.matrixPlotsElement = document.getElementById('matrix-plots');
    this.tooltip = document.getElementById('tooltip');

    // Get analytics from window
    this.analytics = window.firebaseAnalytics;

    this.currentMapId = null;
    this.stakeholders = [];
    this.plotElements = new Map(); // Map of stakeholder ID -> DOM element

    // Initialize with current map data if available
    const currentMap = dataService.getCurrentMap();
    if (currentMap) {
      this.currentMapId = currentMap.id;
      this.stakeholders = currentMap.stakeholders;
    }

    this._initEventListeners();

    // Initial render
    if (this.stakeholders.length > 0) {
      this.render();
    }

    console.log('MatrixView initialized, listening for stakeholder events');
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    EventBus.on('map:current-changed', map => {
      this.currentMapId = map.id;
      this.stakeholders = map.stakeholders;
      this.render();
    });

    EventBus.on('stakeholder:added', ({ map, stakeholder }) => {
      console.log('MatrixView received stakeholder:added event', map.id, this.currentMapId);
      // Update the stakeholders list from the map to ensure we have the latest data
      const currentMap = dataService.getCurrentMap();
      if (currentMap && currentMap.id === map.id) {
        this.stakeholders = currentMap.stakeholders;
        this.render();
        console.log('MatrixView rendered after stakeholder added, stakeholders count:', this.stakeholders.length);
      }
    });

    EventBus.on('stakeholder:updated', stakeholder => {
      const currentMap = dataService.getCurrentMap();
      if (currentMap) {
        this.stakeholders = currentMap.stakeholders;
        this.render();
      }
    });

    EventBus.on('stakeholder:deleted', stakeholderId => {
      const currentMap = dataService.getCurrentMap();
      if (currentMap) {
        this.stakeholders = currentMap.stakeholders;
        this.render();
      }
    });

    // Toggle matrix view visibility
    document.getElementById('matrix-view-btn')?.addEventListener('click', () => {
      this._showMatrixView();
    });

    document.getElementById('list-view-btn')?.addEventListener('click', () => {
      this._showListView();
    });
  }

  /**
   * Render the matrix view
   */
  render() {
    // Clear existing plots
    this.matrixPlotsElement.innerHTML = '';
    this.plotElements.clear();

    // Create plots for each stakeholder
    this.stakeholders.forEach(stakeholder => {
      this._createStakeholderPlot(stakeholder);
    });

    // Log render analytics with null check
    if (this.analytics && typeof this.analytics.logEvent === 'function') {
      this.analytics.logEvent('matrix_rendered', {
        stakeholders_count: this.stakeholders.length
      });
    }
  }

  /**
   * Create a stakeholder plot on the matrix
   * @param {Stakeholder} stakeholder - Stakeholder to plot
   * @private
   */
  _createStakeholderPlot(stakeholder) {
    const position = stakeholder.getPlotPosition();
    if (!position) return;

    const relationshipQuality = stakeholder.getRelationshipQuality() || 'medium';

    // Create plot element
    const plotElement = document.createElement('div');
    plotElement.className = `stakeholder-plot relationship-${relationshipQuality}`;
    plotElement.dataset.id = stakeholder.id;
    plotElement.textContent = this._getInitials(stakeholder.name);

    // Set position
    plotElement.style.left = `${position.x}%`;
    plotElement.style.top = `${position.y}%`;

    // Add event listeners
    this._addPlotEventListeners(plotElement, stakeholder);

    // Add to matrix
    this.matrixPlotsElement.appendChild(plotElement);
    this.plotElements.set(stakeholder.id, plotElement);
  }

  /**
   * Add event listeners to a plot element
   * @param {HTMLElement} plotElement - Plot DOM element
   * @param {Stakeholder} stakeholder - Stakeholder object
   * @private
   */
  _addPlotEventListeners(plotElement, stakeholder) {
    // Show tooltip on hover
    plotElement.addEventListener('mouseenter', (e) => {
      this._showPlotTooltip(e, stakeholder);
    });

    // Hide tooltip when mouse leaves
    plotElement.addEventListener('mouseleave', () => {
      tooltipService.hide();
    });

    // Handle click on stakeholder plot
    plotElement.addEventListener('click', () => {
      // Emit event to show stakeholder details
      EventBus.emit('stakeholder:show-details', stakeholder.id);

      // Track click with null check
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('stakeholder_plot_clicked', {
          stakeholder_id: stakeholder.id,
          stakeholder_name: stakeholder.name,
          quadrant: stakeholder.getQuadrant()
        });
      }
    });
  }

  /**
   * Show tooltip for a stakeholder plot
   * @param {Event} event - Mouse event
   * @param {Stakeholder} stakeholder - Stakeholder object
   * @private
   */
  _showPlotTooltip(event, stakeholder) {
    const content = `
      <div class="plot-tooltip-content">
        <div class="plot-tooltip-header">
          <strong>${stakeholder.name}</strong>
        </div>
        <div class="plot-tooltip-body">
          <div>Influence: ${stakeholder.influence}/10</div>
          <div>Impact: ${stakeholder.impact}/10</div>
          <div>Relationship: ${stakeholder.relationship}/10</div>
          ${stakeholder.category ? `<div>Category: ${this._formatCategory(stakeholder.category)}</div>` : ''}
        </div>
      </div>
    `;

    tooltipService.showTooltip(event, content);
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
   * @returns {string} - Formatted category name
   * @private
   */
  _formatCategory(category) {
    if (!category) return '';

    return category
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Update a specific stakeholder plot
   * @param {string} stakeholderId - Stakeholder ID
   */
  updateStakeholderPlot(stakeholderId) {
    const stakeholder = dataService.getStakeholderById(stakeholderId);
    if (!stakeholder) return;

    // Remove existing plot
    const existingPlot = this.plotElements.get(stakeholderId);
    if (existingPlot) {
      existingPlot.remove();
      this.plotElements.delete(stakeholderId);
    }

    // Create new plot
    this._createStakeholderPlot(stakeholder);
  }

  /**
   * Highlight a stakeholder plot
   * @param {string} stakeholderId - Stakeholder ID to highlight
   */
  highlightStakeholder(stakeholderId) {
    const plotElement = this.plotElements.get(stakeholderId);
    if (plotElement) {
      // Remove highlight from all plots
      this.plotElements.forEach(plot => {
        plot.classList.remove('highlighted');
      });

      // Add highlight to selected plot
      plotElement.classList.add('highlighted');
    }
  }

  /**
   * Clear all highlights
   */
  clearHighlights() {
    this.plotElements.forEach(plot => {
      plot.classList.remove('highlighted');
    });
  }

  /**
   * Show the matrix view
   * @private
   */
  _showMatrixView() {
    document.getElementById('matrix-container').classList.remove('hidden');
    document.getElementById('list-container').classList.add('hidden');
    document.getElementById('matrix-view-btn').classList.add('active');
    document.getElementById('list-view-btn').classList.remove('active');

    // Render the matrix if empty
    if (this.matrixPlotsElement.children.length === 0) {
      this.render();
    }

    // Track view toggle with null check
    if (this.analytics && typeof this.analytics.logEvent === 'function') {
      this.analytics.logEvent('view_toggle', { view: 'matrix' });
    }
  }

  /**
   * Show the list view
   * @private
   */
  _showListView() {
    document.getElementById('matrix-container').classList.add('hidden');
    document.getElementById('list-container').classList.remove('hidden');
    document.getElementById('matrix-view-btn').classList.remove('active');
    document.getElementById('list-view-btn').classList.add('active');

    // Track view toggle with null check
    if (this.analytics && typeof this.analytics.logEvent === 'function') {
      this.analytics.logEvent('view_toggle', { view: 'list' });
    }
  }
}

// Create and export instance
export default new MatrixView();
