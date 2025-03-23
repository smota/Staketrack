import dataService from './dataService.js';
// import { analytics } from '../../../firebase/firebaseConfig.js';

/**
 * Export Service - Handles data export functionality
 */
class ExportService {
  constructor() {
    // Get analytics from window
    this.analytics = window.firebaseAnalytics;
  }

  /**
   * Show export success modal
   * @param {string} filename - Name of the exported file
   * @private
   */
  _showExportSuccessModal(filename) {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal modal-sm';

    // Build success message HTML
    const messageHtml = `
      <div class="export-success-message">
        <div class="success-icon">✓</div>
        <h3>Export Successful</h3>
        <p>File "${filename}" has been exported successfully!</p>
        <p>You can find it in your browser's download folder.</p>
      </div>
    `;

    // Create modal content
    modal.innerHTML = messageHtml;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'btn btn-primary';
    closeButton.style.marginTop = 'var(--spacing-md)';

    // Append elements
    modal.querySelector('.export-success-message').appendChild(closeButton);
    modalContainer.appendChild(modal);
    document.body.appendChild(modalContainer);

    // Show modal with animation
    setTimeout(() => {
      modalContainer.classList.add('visible');
    }, 10);

    // Handle close events
    closeButton.addEventListener('click', () => {
      modalContainer.classList.remove('visible');
      setTimeout(() => {
        document.body.removeChild(modalContainer);
      }, 300); // Wait for transition to complete
    });

    // Also close when clicking outside modal
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        modalContainer.classList.remove('visible');
        setTimeout(() => {
          document.body.removeChild(modalContainer);
        }, 300);
      }
    });
  }

  /**
   * Export a map to JSON file
   * @param {string} mapId - Map ID to export
   * @returns {Promise<void>} - Promise that resolves when export is complete
   */
  async exportMapToJson(mapId) {
    try {
      const map = dataService.getMapById(mapId);
      if (!map) {
        throw new Error(`Map not found: ${mapId}`);
      }

      // Get data to export
      const exportData = dataService.exportMap(mapId);

      // Convert to JSON
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create a blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create file name
      const filename = this._getSafeFileName(map.name) + '_stakeholder_map.json';

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Show success modal
      this._showExportSuccessModal(filename);

      // Track export
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('map_exported', {
          map_id: mapId,
          stakeholders_count: map.stakeholders.length,
          export_format: 'json'
        });
      }

      return true;
    } catch (error) {
      console.error('Error exporting map to JSON:', error);
      throw error;
    }
  }

  /**
   * Export a map to CSV file
   * @param {string} mapId - Map ID to export
   * @returns {Promise<void>} - Promise that resolves when export is complete
   */
  async exportMapToCsv(mapId) {
    try {
      const map = dataService.getMapById(mapId);
      if (!map) {
        throw new Error(`Map not found: ${mapId}`);
      }

      // Define CSV headers
      const headers = [
        'Name', 'Influence', 'Impact', 'Relationship', 'Category',
        'Interests', 'Contribution', 'Risk', 'Communication Style',
        'Engagement Strategy', 'Measurement Approach'
      ];

      // Build CSV content
      let csvContent = headers.join(',') + '\n';

      map.stakeholders.forEach(stakeholder => {
        const row = [
          this._escapeCsvField(stakeholder.name),
          stakeholder.influence || '',
          stakeholder.impact || '',
          stakeholder.relationship || '',
          this._escapeCsvField(stakeholder.category || ''),
          this._escapeCsvField(stakeholder.interests || ''),
          this._escapeCsvField(stakeholder.contribution || ''),
          this._escapeCsvField(stakeholder.risk || ''),
          this._escapeCsvField(stakeholder.communication || ''),
          this._escapeCsvField(stakeholder.strategy || ''),
          this._escapeCsvField(stakeholder.measurement || '')
        ];

        csvContent += row.join(',') + '\n';
      });

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Create file name
      const filename = this._getSafeFileName(map.name) + '_stakeholders.csv';

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Show success modal
      this._showExportSuccessModal(filename);

      // Track export
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('map_exported', {
          map_id: mapId,
          stakeholders_count: map.stakeholders.length,
          export_format: 'csv'
        });
      }

      return true;
    } catch (error) {
      console.error('Error exporting map to CSV:', error);
      throw error;
    }
  }

  /**
   * Export stakeholder interactions to CSV
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<void>} - Promise that resolves when export is complete
   */
  async exportInteractionsToCsv(stakeholderId) {
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

      // Define CSV headers
      const headers = ['Date', 'Time', 'Interaction'];

      // Build CSV content
      let csvContent = headers.join(',') + '\n';

      stakeholder.getLatestInteractions().forEach(interaction => {
        const date = new Date(interaction.date);
        const row = [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          this._escapeCsvField(interaction.text || '')
        ];

        csvContent += row.join(',') + '\n';
      });

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Create file name
      const filename = this._getSafeFileName(stakeholder.name) + '_interactions.csv';

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Show success modal
      this._showExportSuccessModal(filename);

      // Track export
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent('interactions_exported', {
          stakeholder_id: stakeholderId,
          stakeholder_name: stakeholder.name,
          interactions_count: stakeholder.interactions.length,
          export_format: 'csv'
        });
      }

      return true;
    } catch (error) {
      console.error('Error exporting interactions to CSV:', error);
      throw error;
    }
  }

  /**
   * Get a safe file name from a string
   * @param {string} name - Original name
   * @returns {string} - Safe file name
   * @private
   */
  _getSafeFileName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Escape a field for CSV format
   * @param {string} field - Field to escape
   * @returns {string} - Escaped field
   * @private
   */
  _escapeCsvField(field) {
    if (!field) return '';

    // If the field contains commas, quotes, or newlines, wrap it in quotes
    if (/[",\n\r]/.test(field)) {
      // Double up any quotes within the field
      return '"' + field.replace(/"/g, '""') + '"';
    }

    return field;
  }
}

// Singleton instance
export default new ExportService();
