import { EventBus } from '../utils/eventBus.js';
import { formValidation } from '../utils/formValidation.js';
import dataService from '../services/dataService.js';
import { analytics } from '../../../firebase/firebaseConfig.js';

/**
 * Stakeholder Form Component - Renders and manages the stakeholder form
 */
export class StakeholderForm {
  /**
   * Create a new StakeholderForm
   * @param {HTMLElement} container - Container element to render the form in
   * @param {string|null} stakeholderId - ID of stakeholder to edit, or null for new stakeholder
   * @param {Function} onSubmitCallback - Callback function to execute after form submission
   * @param {Function} onCancelCallback - Callback function to execute when form is cancelled
   */
  constructor(container, stakeholderId = null, onSubmitCallback = null, onCancelCallback = null) {
    this.container = container;
    this.stakeholderId = stakeholderId;
    this.onSubmitCallback = onSubmitCallback;
    this.onCancelCallback = onCancelCallback;
    this.isEdit = !!stakeholderId;
    this.stakeholder = null;
    this.formElement = null;

    this._init();
  }

  /**
   * Initialize the form
   * @private
   */
  async _init() {
    if (this.isEdit) {
      // Load stakeholder data if editing
      this.stakeholder = dataService.getStakeholderById(this.stakeholderId);
      if (!this.stakeholder) {
        console.error(`Stakeholder not found: ${this.stakeholderId}`);
        return;
      }
    }

    this.render();
    this._addEventListeners();
  }

  /**
   * Render the form
   */
  render() {
    // Get the form template
    const template = document.getElementById('stakeholder-form-template');
    if (!template) {
      console.error('Stakeholder form template not found');
      return;
    }

    // Clone the template
    const formContent = template.content.cloneNode(true);

    // Clear container and append form
    this.container.innerHTML = '';
    this.container.appendChild(formContent);

    // Get form element
    this.formElement = document.getElementById('stakeholder-form');

    // Populate form if editing
    if (this.isEdit && this.stakeholder) {
      document.getElementById('stakeholder-name').value = this.stakeholder.name || '';

      // Set range input values and their displays
      const influenceValue = this.stakeholder.influence || 5;
      document.getElementById('stakeholder-influence').value = influenceValue;
      document.getElementById('influence-value').textContent = influenceValue;

      const impactValue = this.stakeholder.impact || 5;
      document.getElementById('stakeholder-impact').value = impactValue;
      document.getElementById('impact-value').textContent = impactValue;

      const relationshipValue = this.stakeholder.relationship || 5;
      document.getElementById('stakeholder-relationship').value = relationshipValue;
      document.getElementById('relationship-value').textContent = relationshipValue;

      document.getElementById('stakeholder-category').value = this.stakeholder.category || 'other';
      document.getElementById('stakeholder-interests').value = this.stakeholder.interests || '';
      document.getElementById('stakeholder-contribution').value = this.stakeholder.contribution || '';
      document.getElementById('stakeholder-risk').value = this.stakeholder.risk || '';
      document.getElementById('stakeholder-communication').value = this.stakeholder.communication || '';
      document.getElementById('stakeholder-strategy').value = this.stakeholder.strategy || '';
      document.getElementById('stakeholder-measurement').value = this.stakeholder.measurement || '';
    }
  }

  /**
   * Add event listeners to the form
   * @private
   */
  _addEventListeners() {
    if (!this.formElement) return;

    // Form submit
    this.formElement.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate form
      if (!this._validateForm()) {
        return;
      }

      // Handle submission
      await this._handleSubmit();
    });

    // Cancel button
    const cancelBtn = document.getElementById('cancel-stakeholder-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (this.onCancelCallback) {
          this.onCancelCallback();
        }
      });
    }

    // Form field validation
    document.getElementById('stakeholder-name').addEventListener('blur', () => {
      formValidation.validateRequired('stakeholder-name', 'Name is required');
    });

    document.getElementById('stakeholder-influence').addEventListener('blur', () => {
      formValidation.validateRequired('stakeholder-influence', 'Influence rating is required');
      formValidation.validateRange('stakeholder-influence', 1, 10, 'Influence must be between 1 and 10');
    });

    document.getElementById('stakeholder-impact').addEventListener('blur', () => {
      formValidation.validateRequired('stakeholder-impact', 'Impact rating is required');
      formValidation.validateRange('stakeholder-impact', 1, 10, 'Impact must be between 1 and 10');
    });

    document.getElementById('stakeholder-relationship').addEventListener('blur', () => {
      formValidation.validateRequired('stakeholder-relationship', 'Relationship rating is required');
      formValidation.validateRange('stakeholder-relationship', 1, 10, 'Relationship must be between 1 and 10');
    });
  }

  /**
   * Validate the form
   * @returns {boolean} - Whether the form is valid
   * @private
   */
  _validateForm() {
    let isValid = true;

    // Required fields
    isValid = formValidation.validateRequired('stakeholder-name', 'Name is required') && isValid;
    isValid = formValidation.validateRequired('stakeholder-influence', 'Influence rating is required') && isValid;
    isValid = formValidation.validateRequired('stakeholder-impact', 'Impact rating is required') && isValid;
    isValid = formValidation.validateRequired('stakeholder-relationship', 'Relationship rating is required') && isValid;

    // Range validations
    isValid = formValidation.validateRange('stakeholder-influence', 1, 10, 'Influence must be between 1 and 10') && isValid;
    isValid = formValidation.validateRange('stakeholder-impact', 1, 10, 'Impact must be between 1 and 10') && isValid;
    isValid = formValidation.validateRange('stakeholder-relationship', 1, 10, 'Relationship must be between 1 and 10') && isValid;

    return isValid;
  }

  /**
   * Handle form submission
   * @private
   */
  async _handleSubmit() {
    try {
      // Get form data
      const formData = {
        name: document.getElementById('stakeholder-name').value,
        influence: parseInt(document.getElementById('stakeholder-influence').value),
        impact: parseInt(document.getElementById('stakeholder-impact').value),
        relationship: parseInt(document.getElementById('stakeholder-relationship').value),
        category: document.getElementById('stakeholder-category').value,
        interests: document.getElementById('stakeholder-interests').value,
        contribution: document.getElementById('stakeholder-contribution').value,
        risk: document.getElementById('stakeholder-risk').value,
        communication: document.getElementById('stakeholder-communication').value,
        strategy: document.getElementById('stakeholder-strategy').value,
        measurement: document.getElementById('stakeholder-measurement').value
      };

      if (this.isEdit) {
        // Update existing stakeholder
        await dataService.updateStakeholder(this.stakeholderId, formData);

        analytics.logEvent('stakeholder_updated', {
          stakeholder_id: this.stakeholderId
        });
      } else {
        // Add new stakeholder
        const currentMap = dataService.getCurrentMap();
        if (!currentMap) {
          throw new Error('No map selected');
        }

        const stakeholder = await dataService.addStakeholder(currentMap.id, formData);

        analytics.logEvent('stakeholder_added', {
          stakeholder_id: stakeholder.id,
          map_id: currentMap.id
        });
      }

      // Execute callback if provided
      if (this.onSubmitCallback) {
        this.onSubmitCallback();
      }
    } catch (error) {
      console.error('Error saving stakeholder:', error);
      alert(`Error saving stakeholder: ${error.message}`);
    }
  }

  /**
   * Reset the form
   */
  reset() {
    if (this.formElement) {
      this.formElement.reset();
    }
  }
}
