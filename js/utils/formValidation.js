/**
 * Form Validation Utilities - Helper functions for form validation
 */
class FormValidation {
  /**
   * Validate a required field
   * @param {string} fieldId - ID of the field to validate
   * @param {string} errorMessage - Error message to display if validation fails
   * @returns {boolean} - Whether validation passed
   */
  validateRequired(fieldId, errorMessage = 'This field is required') {
    const field = document.getElementById(fieldId);
    if (!field) return false;
    
    const value = field.value.trim();
    const isValid = value !== '';
    
    this._toggleValidationError(field, isValid, errorMessage);
    
    return isValid;
  }
  
  /**
   * Validate field value against a pattern
   * @param {string} fieldId - ID of the field to validate
   * @param {RegExp} pattern - Validation pattern
   * @param {string} errorMessage - Error message to display if validation fails
   * @returns {boolean} - Whether validation passed
   */
  validatePattern(fieldId, pattern, errorMessage) {
    const field = document.getElementById(fieldId);
    if (!field) return false;
    
    const value = field.value.trim();
    // If field is empty, don't validate pattern (use validateRequired for that)
    if (value === '') return true;
    
    const isValid = pattern.test(value);
    
    this._toggleValidationError(field, isValid, errorMessage);
    
    return isValid;
  }
  
  /**
   * Validate email format
   * @param {string} fieldId - ID of the field to validate
   * @param {string} errorMessage - Error message to display if validation fails
   * @returns {boolean} - Whether validation passed
   */
  validateEmail(fieldId, errorMessage = 'Please enter a valid email address') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.validatePattern(fieldId, emailPattern, errorMessage);
  }
  
  /**
   * Validate numeric field
   * @param {string} fieldId - ID of the field to validate
   * @param {string} errorMessage - Error message to display if validation fails
   * @returns {boolean} - Whether validation passed
   */
  validateNumeric(fieldId, errorMessage = 'Please enter a valid number') {
    const field = document.getElementById(fieldId);
    if (!field) return false;
    
    const value = field.value.trim();
    // If field is empty, don't validate (use validateRequired for that)
    if (value === '') return true;
    
    const isValid = !isNaN(value) && isFinite(value);
    
    this._toggleValidationError(field, isValid, errorMessage);
    
    return isValid;
  }
  
  /**
   * Validate field value is within a range
   * @param {string} fieldId - ID of the field to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {string} errorMessage - Error message to display if validation fails
   * @returns {boolean} - Whether validation passed
   */
  validateRange(fieldId, min, max, errorMessage = `Value must be between ${min} and ${max}`) {
    const field = document.getElementById(fieldId);
    if (!field) return false;
    
    const value = field.value.trim();
    // If field is empty, don't validate range (use validateRequired for that)
    if (value === '') return true;
    
    const numValue = parseFloat(value);
    const isValid = !isNaN(numValue) && numValue >= min && numValue <= max;
    
    this._toggleValidationError(field, isValid, errorMessage);
    
    return isValid;
  }
  
  /**
   * Validate minimum length
   * @param {string} fieldId - ID of the field to validate
   * @param {number} minLength - Minimum length
   * @param {string} errorMessage - Error message to display if validation fails
   * @returns {boolean} - Whether validation passed
   */
  validateMinLength(fieldId, minLength, errorMessage = `Must be at least ${minLength} characters`) {
    const field = document.getElementById(fieldId);
    if (!field) return false;
    
    const value = field.value.trim();
    // If field is empty, don't validate length (use validateRequired for that)
    if (value === '') return true;
    
    const isValid = value.length >= minLength;
    
    this._toggleValidationError(field, isValid, errorMessage);
    
    return isValid;
  }
  
  /**
   * Validate maximum length
   * @param {string} fieldId - ID of the field to validate
   * @param {number} maxLength - Maximum length
   * @param {string} errorMessage - Error message to display if validation fails
   * @returns {boolean} - Whether validation passed
   */
  validateMaxLength(fieldId, maxLength, errorMessage = `Must be no more than ${maxLength} characters`) {
    const field = document.getElementById(fieldId);
    if (!field) return false;
    
    const value = field.value.trim();
    const isValid = value.length <= maxLength;
    
    this._toggleValidationError(field, isValid, errorMessage);
    
    return isValid;
  }
  
  /**
   * Validate password strength
   * @param {string} fieldId - ID of the field to validate
   * @param {string} errorMessage - Error message to display if validation fails
   * @returns {boolean} - Whether validation passed
   */
  validatePasswordStrength(fieldId, errorMessage = 'Password must be at least 8 characters with a mix of letters, numbers, and symbols') {
    const field = document.getElementById(fieldId);
    if (!field) return false;
    
    const value = field.value;
    // If field is empty, don't validate strength (use validateRequired for that)
    if (value === '') return true;
    
    // Password should have at least 8 characters, with a mix of letters, numbers, and symbols
    const strongPasswordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    const isValid = strongPasswordPattern.test(value);
    
    this._toggleValidationError(field, isValid, errorMessage);
    
    return isValid;
  }
  
  /**
   * Validate password confirmation
   * @param {string} passwordFieldId - ID of the password field
   * @param {string} confirmFieldId - ID of the confirmation field
   * @param {string} errorMessage - Error message to display if validation fails
   * @returns {boolean} - Whether validation passed
   */
  validatePasswordConfirmation(passwordFieldId, confirmFieldId, errorMessage = 'Passwords do not match') {
    const passwordField = document.getElementById(passwordFieldId);
    const confirmField = document.getElementById(confirmFieldId);
    if (!passwordField || !confirmField) return false;
    
    const isValid = passwordField.value === confirmField.value;
    
    this._toggleValidationError(confirmField, isValid, errorMessage);
    
    return isValid;
  }
  
  /**
   * Validate a form by running multiple validations
   * @param {Array<Function>} validations - Array of validation functions to run
   * @returns {boolean} - Whether all validations passed
   */
  validateForm(validations) {
    return validations.every(validation => validation());
  }
  
  /**
   * Add error class and message to invalid field
   * @param {HTMLElement} field - Field element
   * @param {boolean} isValid - Whether validation passed
   * @param {string} errorMessage - Error message to display
   * @private
   */
  _toggleValidationError(field, isValid, errorMessage) {
    // Get the parent form group
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    // Remove existing error message
    const existingError = formGroup.querySelector('.form-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Toggle invalid class
    field.classList.toggle('invalid', !isValid);
    
    // Add error message if invalid
    if (!isValid) {
      const errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      errorElement.textContent = errorMessage;
      formGroup.appendChild(errorElement);
    }
  }
  
  /**
   * Clear validation errors from a form
   * @param {HTMLFormElement} form - Form element
   */
  clearValidationErrors(form) {
    const errorMessages = form.querySelectorAll('.form-error');
    errorMessages.forEach(error => error.remove());
    
    const invalidFields = form.querySelectorAll('.invalid');
    invalidFields.forEach(field => field.classList.remove('invalid'));
  }
}

// Singleton instance
export const formValidation = new FormValidation();
