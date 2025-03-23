import { EventBus } from '../utils/eventBus.js';
import dataService from '../services/dataService.js';
import exportService from '../services/exportService.js';
import llmService from '../services/llmService.js';
import matrixView from '../components/matrixView.js';
import stakeholderList from '../components/stakeholderList.js';

/**
 * Map View - Handles the main map view and interactions
 */
class MapView {
  constructor() {
    this.viewElement = document.getElementById('map-view');
    this.sidebarElement = document.getElementById('sidebar');
    this.currentMapNameElement = document.getElementById('current-map-name');
    this.matrixContainer = document.getElementById('matrix-container');
    this.listContainer = document.getElementById('list-container');

    this.addStakeholderBtn = document.getElementById('add-stakeholder-btn');
    this.exportMapBtn = document.getElementById('export-map-btn');
    this.importMapBtn = document.getElementById('import-map-btn');
    this.mapAdviceBtn = document.getElementById('map-advice-btn');
    this.editMapBtn = document.getElementById('edit-map-btn');

    this.matrixViewBtn = document.getElementById('matrix-view-btn');
    this.listViewBtn = document.getElementById('list-view-btn');

    this.currentMapId = null;
    this.currentMap = null;

    // Get analytics from window
    this.analytics = window.firebaseAnalytics;

    this._initEventListeners();
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Add stakeholder button
    this.addStakeholderBtn.addEventListener('click', () => {
      EventBus.emit('stakeholder:show-form');

      this.analytics.trackEvent('add_stakeholder_clicked');
    });

    // Export map button
    this.exportMapBtn.addEventListener('click', () => {
      this._showExportOptions();
    });

    // Import map button
    this.importMapBtn.addEventListener('click', () => {
      EventBus.emit('map:show-import');
    });

    // Map advice button
    this.mapAdviceBtn.addEventListener('click', () => {
      this._getMapRecommendations();
    });

    // Edit map button
    this.editMapBtn.addEventListener('click', () => {
      EventBus.emit('map:show-form', this.currentMapId);
    });

    // View toggle buttons
    this.matrixViewBtn.addEventListener('click', () => {
      this._showMatrixView();
    });

    this.listViewBtn.addEventListener('click', () => {
      this._showListView();
    });

    // Listen for map changes
    EventBus.on('map:current-changed', map => {
      this.currentMapId = map.id;
      this.currentMap = map;
      this._updateMapDisplay();
    });
  }

  /**
   * Update the map display
   * @private
   */
  _updateMapDisplay() {
    if (this.currentMap) {
      this.currentMapNameElement.textContent = this.currentMap.name;
    } else {
      this.currentMapNameElement.textContent = 'Stakeholder Map';
    }
  }

  /**
   * Show the matrix view
   * @private
   */
  _showMatrixView() {
    this.matrixContainer.classList.remove('hidden');
    this.listContainer.classList.add('hidden');

    this.matrixViewBtn.classList.add('active');
    this.listViewBtn.classList.remove('active');

    // Render matrix if needed
    matrixView.render();

    this.analytics.trackEvent('view_toggle', { view: 'matrix' });
  }

  /**
   * Show the list view
   * @private
   */
  _showListView() {
    this.matrixContainer.classList.add('hidden');
    this.listContainer.classList.remove('hidden');

    this.matrixViewBtn.classList.remove('active');
    this.listViewBtn.classList.add('active');

    // Force render the stakeholder list
    stakeholderList.render();

    this.analytics.trackEvent('view_toggle', { view: 'list' });
  }

  /**
   * Show export options
   * @private
   */
  _showExportOptions() {
    const options = [
      { id: 'json', label: 'Export as JSON' },
      { id: 'csv', label: 'Export as CSV' }
    ];

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';

    options.forEach(option => {
      const item = document.createElement('button');
      item.className = 'dropdown-item';
      item.textContent = option.label;
      item.addEventListener('click', () => {
        this._handleExport(option.id);
        menu.remove();
      });

      menu.appendChild(item);
    });

    // Position menu near the export button
    const rect = this.exportMapBtn.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom}px`;
    menu.style.left = `${rect.left}px`;
    menu.style.zIndex = 1000;

    // Add to document
    document.body.appendChild(menu);

    // Close when clicking outside
    const clickHandler = (e) => {
      if (!menu.contains(e.target) && e.target !== this.exportMapBtn) {
        menu.remove();
        document.removeEventListener('click', clickHandler);
      }
    };

    // Add delay before adding click handler to prevent immediate close
    setTimeout(() => {
      document.addEventListener('click', clickHandler);
    }, 100);
  }

  /**
   * Handle export based on format
   * @param {string} format - Export format (json, csv)
   * @private
   */
  _handleExport(format) {
    if (!this.currentMapId) {
      alert('No map selected.');
      return;
    }

    try {
      if (format === 'json') {
        exportService.exportMapToJson(this.currentMapId);
      } else if (format === 'csv') {
        exportService.exportMapToCsv(this.currentMapId);
      }

      this.analytics.trackEvent('map_exported', {
        map_id: this.currentMapId,
        format: format
      });
    } catch (error) {
      console.error('Export error:', error);
      alert(`Error exporting map: ${error.message}`);
    }
  }

  /**
   * Get AI-powered recommendations for the current map
   * @private
   */
  async _getMapRecommendations() {
    if (!this.currentMap) {
      alert('No map selected.');
      return;
    }

    // Check if there are stakeholders
    if (this.currentMap.stakeholders.length === 0) {
      alert('Please add stakeholders to the map before requesting recommendations.');
      return;
    }

    // Show loading modal
    EventBus.emit('modal:show', {
      title: 'Next Best Action Recommendations',
      content: `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Generating recommendations...</p>
        </div>
      `
    });

    try {
      // Get recommendations from LLM service
      const recommendations = await llmService.getMapRecommendations(this.currentMap);

      // Update modal with recommendations
      EventBus.emit('modal:update', {
        title: 'Next Best Action Recommendations',
        content: `
          <div class="recommendations-container">
            ${this._formatMarkdown(recommendations)}
          </div>
        `
      });

      this.analytics.trackEvent('map_recommendations_generated', {
        map_id: this.currentMapId,
        stakeholders_count: this.currentMap.stakeholders.length
      });
    } catch (error) {
      console.error('Error getting map recommendations:', error);

      // Show error in modal
      EventBus.emit('modal:update', {
        title: 'Error Getting Recommendations',
        content: `
          <div class="error-message">
            <h4>Error Getting Recommendations</h4>
            <p>${error.message}</p>
            <p>Please check your API key settings and try again.</p>
          </div>
        `
      });

      this.analytics.trackEvent('map_recommendations_error', {
        map_id: this.currentMapId,
        error_message: error.message
      });
    }
  }

  /**
   * Format markdown text to HTML
   * @param {string} markdown - Markdown text
   * @returns {string} - HTML string
   * @private
   */
  _formatMarkdown(markdown) {
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
   * Show the map view
   */
  show() {
    // Get current map
    this.currentMap = dataService.getCurrentMap();
    if (this.currentMap) {
      this.currentMapId = this.currentMap.id;
      this._updateMapDisplay();
    }

    // Show the view
    this.viewElement.classList.remove('hidden');

    // Default to matrix view
    this._showMatrixView();

    this.analytics.trackPageView('map', {
      map_id: this.currentMapId
    });
  }

  /**
   * Hide the map view
   */
  hide() {
    this.viewElement.classList.add('hidden');
  }

  /**
   * Toggle the sidebar visibility (for mobile)
   */
  toggleSidebar() {
    this.sidebarElement.classList.toggle('visible');

    const isVisible = this.sidebarElement.classList.contains('visible');
    document.getElementById('sidebar-overlay')?.classList.toggle('visible', isVisible);

    this.analytics.trackEvent('sidebar_toggle', {
      visible: isVisible
    });
  }
}

// Create and export instance
export default new MapView();
