import { EventBus } from '../utils/eventBus.js';
import dataService from '../services/dataService.js';
import authService from '../services/authService.js';
import { dateUtils } from '../utils/dateUtils.js';
import { analytics } from '../../../firebase/firebaseConfig.js';

/**
 * Dashboard View - Handles the dashboard view and interactions
 */
class DashboardView {
  constructor() {
    this.viewElement = document.getElementById('dashboard-view');
    this.createMapBtn = document.getElementById('dashboard-create-map-btn');
    this.savedMapsContainer = document.getElementById('saved-maps-container');
    this.savedMapsList = document.getElementById('saved-maps-list');
    
    this._initEventListeners();
  }
  
  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Create map button
    this.createMapBtn.addEventListener('click', () => {
      EventBus.emit('map:show-form');
      
      analytics.trackEvent('create_map_clicked', {
        source: 'dashboard'
      });
    });
    
    // Listen for data changes
    EventBus.on('data:synced', () => {
      this._renderSavedMaps();
    });
    
    EventBus.on('map:created', () => {
      this._renderSavedMaps();
    });
    
    EventBus.on('map:deleted', () => {
      this._renderSavedMaps();
    });
  }
  
  /**
   * Render the saved maps list
   * @private
   */
  _renderSavedMaps() {
    const maps = dataService.getAllMaps();
    
    if (maps.length === 0) {
      this.savedMapsContainer.classList.add('hidden');
      return;
    }
    
    // Show container
    this.savedMapsContainer.classList.remove('hidden');
    
    // Clear existing content
    this.savedMapsList.innerHTML = '';
    
    // Render map cards
    maps.forEach(map => {
      this._renderMapCard(map);
    });
  }
  
  /**
   * Render a map card
   * @param {StakeholderMap} map - Map object
   * @private
   */
  _renderMapCard(map) {
    const stats = map.getStatistics();
    const lastUpdated = dateUtils.formatDate(map.updated, 'relative');
    
    const card = document.createElement('div');
    card.className = 'map-card card card-interactive';
    card.dataset.id = map.id;
    
    card.innerHTML = `
      <div class="card-header">
        <h4>${map.name}</h4>
      </div>
      <div class="card-content">
        ${map.description ? `<p>${map.description}</p>` : ''}
        <div class="map-stats">
          <span class="map-stats-item">${stats.stakeholdersCount} stakeholders</span>
          <span class="map-stats-item">Avg Relationship: ${stats.avgRelationship}/10</span>
        </div>
        <div class="map-updated">Last updated: ${lastUpdated}</div>
      </div>
      <div class="card-footer">
        <button class="btn btn-primary open-map-btn">Open</button>
        <button class="btn btn-secondary edit-map-btn">Edit</button>
        <button class="btn btn-secondary delete-map-btn">Delete</button>
      </div>
    `;
    
    // Add event listeners
    card.querySelector('.open-map-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this._openMap(map.id);
    });
    
    card.querySelector('.edit-map-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this._editMap(map.id);
    });
    
    card.querySelector('.delete-map-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this._deleteMap(map.id);
    });
    
    // Card click
    card.addEventListener('click', () => {
      this._openMap(map.id);
    });
    
    // Add to list
    this.savedMapsList.appendChild(card);
  }
  
  /**
   * Open a map
   * @param {string} mapId - Map ID
   * @private
   */
  _openMap(mapId) {
    dataService.setCurrentMap(mapId);
    EventBus.emit('view:change', 'map');
    
    analytics.trackEvent('map_opened', {
      map_id: mapId,
      source: 'dashboard'
    });
  }
  
  /**
   * Edit a map
   * @param {string} mapId - Map ID
   * @private
   */
  _editMap(mapId) {
    EventBus.emit('map:show-form', mapId);
    
    analytics.trackEvent('map_edit_clicked', {
      map_id: mapId,
      source: 'dashboard'
    });
  }
  
  /**
   * Delete a map
   * @param {string} mapId - Map ID
   * @private
   */
  _deleteMap(mapId) {
    const map = dataService.getMapById(mapId);
    if (!map) return;
    
    if (confirm(`Are you sure you want to delete "${map.name}"? This action cannot be undone.`)) {
      dataService.deleteMap(mapId)
        .then(() => {
          this._renderSavedMaps();
          
          analytics.trackEvent('map_deleted', {
            map_id: mapId,
            source: 'dashboard'
          });
        })
        .catch(error => {
          console.error('Error deleting map:', error);
          alert(`Error deleting map: ${error.message}`);
        });
    }
  }
  
  /**
   * Show the dashboard view
   */
  show() {
    // Render saved maps
    this._renderSavedMaps();
    
    // Update welcome message if user is authenticated
    const user = authService.getCurrentUser();
    const welcomeHeading = this.viewElement.querySelector('h2');
    if (welcomeHeading) {
      welcomeHeading.textContent = user 
        ? `Welcome to StakeTrack, ${user.displayName || user.email}`
        : 'Welcome to StakeTrack';
    }
    
    // Show the view
    this.viewElement.classList.remove('hidden');
    
    analytics.trackPageView('dashboard');
  }
  
  /**
   * Hide the dashboard view
   */
  hide() {
    this.viewElement.classList.add('hidden');
  }
}

// Create and export instance
export default new DashboardView();
