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

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = this._getSafeFileName(map.name) + '_stakeholder_map.json';
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

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

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = this._getSafeFileName(map.name) + '_stakeholders.csv';
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

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
      const stakeholder = dataService.getStakeholderById(stakeholderId);
      if (!stakeholder) {
        throw new Error(`Stakeholder not found: ${stakeholderId}`);
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

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = this._getSafeFileName(stakeholder.name) + '_interactions.csv';
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

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
