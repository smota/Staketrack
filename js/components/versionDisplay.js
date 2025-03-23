/**
 * Version Display Component
 * 
 * This component displays the current application version in the UI.
 */

import { config } from '../config.js';
import telemetryService from '../services/telemetryService.js';

class VersionDisplay {
  constructor() {
    this.container = null;
  }

  /**
   * Initialize the version display component
   */
  init() {
    // Create version display element
    this.container = document.createElement('div');
    this.container.id = 'version-display';
    this.container.className = 'version-display';
    this.container.title = `Full version: ${config.version}`;

    // Add version text
    this.container.textContent = `v${config.semanticVersion}`;

    // Append to the DOM
    this._attachToDOM();

    // Log initialization
    telemetryService.info('Version display initialized', {
      version: config.version,
      semanticVersion: config.semanticVersion
    });
  }

  /**
   * Attach the version display to the DOM
   * @private
   */
  _attachToDOM() {
    // Get the footer or create one if it doesn't exist
    let footer = document.querySelector('footer#app-footer');

    if (!footer) {
      footer = document.createElement('footer');
      footer.id = 'app-footer';
      document.body.appendChild(footer);
    }

    // Append the version display to the footer
    footer.appendChild(this.container);
  }

  /**
   * Update the version display
   * Called when the version changes (e.g., after refresh)
   */
  update() {
    if (this.container) {
      this.container.textContent = `v${config.semanticVersion}`;
      this.container.title = `Full version: ${config.version}`;
    }
  }
}

export default new VersionDisplay(); 