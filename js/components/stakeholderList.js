import { EventBus } from '../utils/eventBus.js';
import dataService from '../services/dataService.js';
import { analytics } from '../../../firebase/firebaseConfig.js';

/**
 * Stakeholder List Component - Manages the list view of stakeholders
 */
export class StakeholderList {
  /**
   * Create a new StakeholderList
   * @param {HTMLElement} container - Container element to render the list in
   */
  constructor(container) {
    this.container = container;
    this.stakeholders = [];
    this.filteredStakeholders = [];
    this.categoryFilter = '';
    this.sortBy = 'name';
    this.sortDirection = 'asc';
    
    this._initEventListeners();
  }
  
  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Listen for stakeholder changes
    EventBus.on('map:current-changed', map => {
      this.stakeholders = map.stakeholders;
      this.render();
    });
    
    EventBus.on('stakeholder:added', ({ stakeholder }) => {
      this.render();
    });
    
    EventBus.on('stakeholder:updated', () => {
      this.render();
    });
    
    EventBus.on('stakeholder:deleted', () => {
      this.render();
    });
    
    // Add filter and sort event listeners
    document.getElementById('category-filter')?.addEventListener('change', (e) => {
      this.categoryFilter = e.target.value;
      this._filterAndSortStakeholders();
      this.render();
      
      analytics.logEvent('stakeholder_filter_changed', {
        filter_type: 'category',
        filter_value: this.categoryFilter
      });
    });
    
    document.getElementById('sort-by')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this._filterAndSortStakeholders();
      this.render();
      
      analytics.logEvent('stakeholder_sort_changed', {
        sort_by: this.sortBy
      });
    });
  }
  
  /**
   * Filter and sort stakeholders
   * @private
   */
  _filterAndSortStakeholders() {
    // Apply category filter
    this.filteredStakeholders = this.categoryFilter 
      ? this.stakeholders.filter(s => s.category === this.categoryFilter) 
      : [...this.stakeholders];
    
    // Apply sorting
    this.filteredStakeholders.sort((a, b) => {
      const aValue = a[this.sortBy] || 0;
      const bValue = b[this.sortBy] || 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else {
        return this.sortDirection === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
    });
  }
  
  /**
   * Render the stakeholder list
   */
  render() {
    // Make sure we have the right container
    const tableBody = document.getElementById('stakeholders-table-body');
    if (!tableBody) return;
    
    // Apply filters and sorting
    this._filterAndSortStakeholders();
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Check if we have stakeholders
    if (this.filteredStakeholders.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <div class="empty-state">
              <p>No stakeholders found</p>
              <button id="add-stakeholder-from-list" class="btn btn-primary">
                Add Stakeholder
              </button>
            </div>
          </td>
        </tr>
      `;
      
      // Add event listener to the add button
      document.getElementById('add-stakeholder-from-list')?.addEventListener('click', () => {
        EventBus.emit('stakeholder:show-form');
      });
      
      return;
    }
    
    // Populate table with stakeholders
    this.filteredStakeholders.forEach(stakeholder => {
      const row = document.createElement('tr');
      row.dataset.id = stakeholder.id;
      
      const relationshipQuality = stakeholder.getRelationshipQuality() || 'medium';
      
      row.innerHTML = `
        <td>
          <div class="stakeholder-list-name">
            <span class="stakeholder-indicator relationship-${relationshipQuality}"></span>
            ${stakeholder.name}
          </div>
        </td>
        <td>${stakeholder.influence || '-'}</td>
        <td>${stakeholder.impact || '-'}</td>
        <td>${stakeholder.relationship || '-'}</td>
        <td>${this._formatCategory(stakeholder.category)}</td>
        <td>
          <div class="stakeholder-actions">
            <button class="btn btn-icon view-details-btn" aria-label="View Details">
              <span class="icon">👁️</span>
            </button>
            <button class="btn btn-icon edit-btn" aria-label="Edit">
              <span class="icon">✏️</span>
            </button>
            <button class="btn btn-icon log-interaction-btn" aria-label="Log Interaction">
              <span class="icon">💬</span>
            </button>
            <button class="btn btn-icon delete-btn" aria-label="Delete">
              <span class="icon">🗑️</span>
            </button>
          </div>
        </td>
      `;
      
      // Add row to table
      tableBody.appendChild(row);
      
      // Add event listeners
      this._addRowEventListeners(row, stakeholder);
    });
    
    // Update category filter options if needed
    this._updateCategoryFilterOptions();
  }
  
  /**
   * Add event listeners to a table row
   * @param {HTMLElement} row - Table row element
   * @param {Stakeholder} stakeholder - Stakeholder object
   * @private
   */
  _addRowEventListeners(row, stakeholder) {
    // View details button
    row.querySelector('.view-details-btn').addEventListener('click', () => {
      EventBus.emit('stakeholder:show-details', stakeholder.id);
      
      analytics.logEvent('stakeholder_details_clicked', {
        stakeholder_id: stakeholder.id,
        source: 'list_view'
      });
    });
    
    // Edit button
    row.querySelector('.edit-btn').addEventListener('click', () => {
      EventBus.emit('stakeholder:show-form', stakeholder.id);
      
      analytics.logEvent('stakeholder_edit_clicked', {
        stakeholder_id: stakeholder.id,
        source: 'list_view'
      });
    });
    
    // Log interaction button
    row.querySelector('.log-interaction-btn').addEventListener('click', () => {
      EventBus.emit('stakeholder:show-interaction-log', stakeholder.id);
      
      analytics.logEvent('log_interaction_clicked', {
        stakeholder_id: stakeholder.id,
        source: 'list_view'
      });
    });
    
    // Delete button
    row.querySelector('.delete-btn').addEventListener('click', () => {
      this._confirmDelete(stakeholder);
      
      analytics.logEvent('stakeholder_delete_clicked', {
        stakeholder_id: stakeholder.id,
        source: 'list_view'
      });
    });
    
    // Row click (for details)
    row.addEventListener('click', (e) => {
      // Only trigger if not clicking a button
      if (!e.target.closest('button')) {
        EventBus.emit('stakeholder:show-details', stakeholder.id);
        
        analytics.logEvent('stakeholder_row_clicked', {
          stakeholder_id: stakeholder.id
        });
      }
    });
  }
  
  /**
   * Confirm and delete a stakeholder
   * @param {Stakeholder} stakeholder - Stakeholder to delete
   * @private
   */
  _confirmDelete(stakeholder) {
    if (confirm(`Are you sure you want to delete "${stakeholder.name}"? This action cannot be undone.`)) {
      dataService.deleteStakeholder(stakeholder.id)
        .then(() => {
          analytics.logEvent('stakeholder_deleted', {
            stakeholder_id: stakeholder.id
          });
        })
        .catch(error => {
          console.error('Error deleting stakeholder:', error);
          alert(`Error deleting stakeholder: ${error.message}`);
        });
    }
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
   * Update category filter options based on available categories
   * @private
   */
  _updateCategoryFilterOptions() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    
    // Get current selection
    const currentSelection = categoryFilter.value;
    
    // Get unique categories
    const categories = new Set();
    categories.add(''); // Empty option for "All Categories"
    
    this.stakeholders.forEach(stakeholder => {
      if (stakeholder.category) {
        categories.add(stakeholder.category);
      }
    });
    
    // Clear existing options
    categoryFilter.innerHTML = '';
    
    // Add "All Categories" option
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.text = 'All Categories';
    categoryFilter.appendChild(allOption);
    
    // Add category options
    Array.from(categories)
      .filter(cat => cat !== '') // Remove empty category
      .sort() // Sort alphabetically
      .forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.text = this._formatCategory(category);
        categoryFilter.appendChild(option);
      });
    
    // Restore selection if possible
    if (categories.has(currentSelection)) {
      categoryFilter.value = currentSelection;
    }
  }
  
  /**
   * Toggle sort direction
   * @param {string} column - Column to sort by
   */
  toggleSort(column) {
    if (this.sortBy === column) {
      // Toggle direction if same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    
    this._filterAndSortStakeholders();
    this.render();
  }
}

// Create and export instance
export default new StakeholderList(document.getElementById('stakeholders-table-body'));
