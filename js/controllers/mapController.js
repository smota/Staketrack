import { EventBus } from '../utils/eventBus.js';
import dataService from '../services/dataService.js';
import llmService from '../services/llmService.js';
import { analytics } from '../../../firebase/firebaseConfig.js';

/**
 * Map Controller - Manages map-related operations
 */
export class MapController {
  constructor() {
    this.modal = document.getElementById('modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalContent = document.getElementById('modal-content');
    this.modalContainer = document.getElementById('modal-container');
    
    this.mapFormTemplate = document.getElementById('map-form-template');
    this.mapAdviceTemplate = document.getElementById('map-advice-template');
    
    this.currentMapId = null;
    
    this._initEventListeners();
  }
  
  /**
   * Initialize the controller
   */
  init() {
    // Additional initialization if needed
  }
  
  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Create map buttons
    document.getElementById('create-map-btn').addEventListener('click', () => {
      this.showMapForm();
    });
    
    document.getElementById('dashboard-create-map-btn').addEventListener('click', () => {
      this.showMapForm();
    });
    
    // Edit map button
    document.getElementById('edit-map-btn').addEventListener('click', () => {
      const currentMap = dataService.getCurrentMap();
      if (currentMap) {
        this.showMapForm(currentMap.id);
      }
    });
    
    // Import/Export buttons
    document.getElementById('import-map-btn').addEventListener('click', () => {
      this.showImportForm();
    });
    
    document.getElementById('export-map-btn').addEventListener('click', () => {
      this.exportCurrentMap();
    });
    
    // Map advice button
    document.getElementById('map-advice-btn').addEventListener('click', () => {
      this.getMapRecommendations();
    });
    
    // Map events
    EventBus.on('map:current-changed', map => {
      this.currentMapId = map.id;
      this._updateCurrentMapDisplay(map);
    });
  }
  
  /**
   * Update the current map display
   * @param {StakeholderMap} map - Current map
   * @private
   */
  _updateCurrentMapDisplay(map) {
    const mapNameElement = document.getElementById('current-map-name');
    if (mapNameElement) {
      mapNameElement.textContent = map.name;
    }
  }
  
  /**
   * Show the map form modal
   * @param {string} [mapId] - Map ID to edit, or null for new map
   */
  showMapForm(mapId = null) {
    const isEdit = !!mapId;
    this.currentMapId = mapId;
    
    // Set modal title
    this.modalTitle.textContent = isEdit ? 'Edit Map' : 'Create New Map';
    
    // Clone the form template
    const formContent = this.mapFormTemplate.content.cloneNode(true);
    this.modalContent.innerHTML = '';
    this.modalContent.appendChild(formContent);
    
    const form = document.getElementById('map-form');
    
    // If editing, populate form with map data
    if (isEdit) {
      const map = dataService.getMapById(mapId);
      if (map) {
        document.getElementById('map-name').value = map.name || '';
        document.getElementById('map-description').value = map.description || '';
      }
    }
    
    // Form submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleMapFormSubmit(form, isEdit);
    });
    
    // Cancel button handler
    document.getElementById('cancel-map-btn').addEventListener('click', () => {
      this.hideModal();
    });
    
    // Show modal
    this.showModal();
    
    // Track analytics
    analytics.logEvent('map_form_opened', { 
      action: isEdit ? 'edit' : 'create'
    });
  }
  
  /**
   * Handle map form submission
   * @param {HTMLFormElement} form - Form element
   * @param {boolean} isEdit - Whether this is an edit or new map
   * @private
   */
  async _handleMapFormSubmit(form, isEdit) {
    try {
      // Get form data
      const formData = {
        name: document.getElementById('map-name').value,
        description: document.getElementById('map-description').value
      };
      
      if (isEdit) {
        // Update existing map
        await dataService.updateMap(this.currentMapId, formData);
        
        analytics.logEvent('map_updated', {
          map_id: this.currentMapId
        });
      } else {
        // Create new map
        const map = await dataService.createMap(formData);
        
        analytics.logEvent('map_created', {
          map_id: map.id
        });
      }
      
      // Hide modal
      this.hideModal();
    } catch (error) {
      console.error('Error saving map:', error);
      alert(`Error saving map: ${error.message}`);
    }
  }
  
  /**
   * Show the import form modal
   */
  showImportForm() {
    // Set modal title
    this.modalTitle.textContent = 'Import Stakeholder Map';
    
    // Create import form
    const importForm = document.createElement('div');
    importForm.className = 'import-form';
    importForm.innerHTML = `
      <p>Import a stakeholder map from a JSON file.</p>
      <div class="form-group">
        <label for="import-file">Select JSON File</label>
        <input type="file" id="import-file" accept=".json">
      </div>
      <p class="note">Note: This will create a new map with the imported data.</p>
      <div class="form-actions">
        <button id="import-btn" class="btn btn-primary">Import</button>
        <button id="cancel-import-btn" class="btn btn-secondary">Cancel</button>
      </div>
    `;
    
    // Clear modal content and add import form
    this.modalContent.innerHTML = '';
    this.modalContent.appendChild(importForm);
    
    // Add event listeners
    document.getElementById('import-btn').addEventListener('click', () => {
      this._handleImport();
    });
    
    document.getElementById('cancel-import-btn').addEventListener('click', () => {
      this.hideModal();
    });
    
    // Show modal
    this.showModal();
    
    // Track analytics
    analytics.logEvent('import_form_opened');
  }
  
  /**
   * Handle import from file
   * @private
   */
  _handleImport() {
    const fileInput = document.getElementById('import-file');
    
    if (!fileInput.files || fileInput.files.length === 0) {
      alert('Please select a file to import.');
      return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Import data
        await dataService.importData(data);
        
        // Hide modal
        this.hideModal();
        
        // Track analytics
        analytics.logEvent('map_imported', {
          file_name: file.name,
          file_size: file.size
        });
      } catch (error) {
        console.error('Error importing data:', error);
        alert(`Error importing data: ${error.message}`);
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file.');
    };
    
    reader.readAsText(file);
  }
  
  /**
   * Export the current map
   */
  exportCurrentMap() {
    try {
      const currentMap = dataService.getCurrentMap();
      if (!currentMap) {
        alert('No map selected.');
        return;
      }
      
      // Export map data
      const data = dataService.exportMap(currentMap.id);
      
      // Convert to JSON
      const json = JSON.stringify(data, null, 2);
      
      // Create blob and download link
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentMap.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_stakeholder_map.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Track analytics
      analytics.logEvent('map_exported', {
        map_id: currentMap.id,
        stakeholders_count: currentMap.stakeholders.length
      });
    } catch (error) {
      console.error('Error exporting map:', error);
      alert(`Error exporting map: ${error.message}`);
    }
  }
  
  /**
   * Get AI-powered recommendations for the current map
   */
  async getMapRecommendations() {
    const currentMap = dataService.getCurrentMap();
    if (!currentMap) {
      alert('No map selected.');
      return;
    }
    
    // Check if there are stakeholders
    if (currentMap.stakeholders.length === 0) {
      alert('Please add stakeholders to the map before requesting recommendations.');
      return;
    }
    
    // Set modal title
    this.modalTitle.textContent = 'Next Best Action Recommendations';
    
    // Clone the advice template
    const adviceContent = this.mapAdviceTemplate.content.cloneNode(true);
    this.modalContent.innerHTML = '';
    this.modalContent.appendChild(adviceContent);
    
    // Show loading state
    document.getElementById('advice-loading').classList.remove('hidden');
    document.getElementById('advice-content').classList.add('hidden');
    
    // Show modal
    this.showModal();
    
    try {
      // Get advice from LLM service
      const recommendations = await llmService.getMapRecommendations(currentMap);
      
      // Hide loading, show content
      document.getElementById('advice-loading').classList.add('hidden');
      document.getElementById('advice-content').classList.remove('hidden');
      
      // Set advice content with markdown formatting
      const adviceContent = document.getElementById('advice-content');
      adviceContent.innerHTML = this._markdownToHtml(recommendations);
      
      // Track analytics
      analytics.logEvent('map_recommendations_generated', {
        map_id: currentMap.id,
        stakeholders_count: currentMap.stakeholders.length
      });
    } catch (error) {
      console.error('Error getting map recommendations:', error);
      
      // Hide loading, show error
      document.getElementById('advice-loading').classList.add('hidden');
      document.getElementById('advice-content').classList.remove('hidden');
      document.getElementById('advice-content').innerHTML = `
        <div class="error-message">
          <h4>Error Getting Recommendations</h4>
          <p>${error.message}</p>
          <p>Please check your API key settings and try again.</p>
        </div>
      `;
      
      // Track error
      analytics.logEvent('map_recommendations_error', {
        map_id: currentMap.id,
        error_message: error.message
      });
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
    document.getElementById('modal-container').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('modal-container').classList.add('visible');
    }, 10);
  }
  
  /**
   * Hide the modal
   */
  hideModal() {
    document.getElementById('modal-container').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('modal-container').classList.add('hidden');
      this.modalContent.innerHTML = '';
      this.currentMapId = null;
    }, 300); // Wait for transition to complete
  }
}

// Singleton instance
export default new MapController();
