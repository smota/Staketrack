import { EventBus } from '../utils/eventBus.js';
import authService from '../services/authService.js';
import { formValidation } from '../utils/formValidation.js';

/**
 * Auth View - Handles authentication view and interactions
 */
class AuthView {
  constructor() {
    this.viewElement = document.getElementById('auth-view');
    this.authForm = document.getElementById('email-auth-form');
    this.authToggleBtn = document.getElementById('auth-toggle-btn');
    this.authToggleText = document.getElementById('auth-toggle-text');
    this.googleAuthBtn = document.getElementById('google-auth-btn');
    this.microsoftAuthBtn = document.getElementById('microsoft-auth-btn');
    this.skipAuthBtn = document.getElementById('skip-auth-btn');
    this.emailAuthBtn = document.getElementById('email-auth-btn');

    this.isSignUp = false;

    this._initEventListeners();

    // Debug log to verify initialization
    console.log('AuthView initialized');
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Form submit
    if (this.authForm) {
      this.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this._handleEmailAuth();
      });
    }

    // Toggle sign in/sign up
    if (this.authToggleBtn) {
      this.authToggleBtn.addEventListener('click', () => {
        this.isSignUp = !this.isSignUp;
        this._updateAuthFormState();

        // Get analytics from window
        const analytics = window.firebaseAnalytics;
        if (analytics) {
          analytics.trackEvent('auth_toggle', {
            mode: this.isSignUp ? 'signup' : 'signin'
          });
        }
      });
    }

    // Google sign in
    if (this.googleAuthBtn) {
      this.googleAuthBtn.addEventListener('click', async () => {
        await this._handleGoogleAuth();
      });
    }

    // Microsoft sign in
    if (this.microsoftAuthBtn) {
      this.microsoftAuthBtn.addEventListener('click', async () => {
        await this._handleMicrosoftAuth();
      });
    }

    // Skip auth button
    if (this.skipAuthBtn) {
      this.skipAuthBtn.addEventListener('click', () => {
        this._handleSkipAuth();
      });
    }

    // Field validation
    const emailField = document.getElementById('auth-email');
    if (emailField) {
      emailField.addEventListener('blur', () => {
        formValidation.validateEmail('auth-email', 'Please enter a valid email address');
      });

      // Also clear validation on input
      emailField.addEventListener('input', () => {
        formValidation.clearValidationErrors(this.authForm);
      });
    }

    const passwordField = document.getElementById('auth-password');
    if (passwordField) {
      passwordField.addEventListener('blur', () => {
        formValidation.validateMinLength('auth-password', 6, 'Password must be at least 6 characters');
      });

      // Also clear validation on input
      passwordField.addEventListener('input', () => {
        formValidation.clearValidationErrors(this.authForm);
      });
    }
  }

  /**
   * Update authentication form state (sign in/sign up)
   * @private
   */
  _updateAuthFormState() {
    if (this.isSignUp) {
      this.authToggleText.textContent = 'Already have an account?';
      this.authToggleBtn.textContent = 'Sign In';
      if (this.emailAuthBtn) {
        this.emailAuthBtn.textContent = 'Sign Up';
      }
    } else {
      this.authToggleText.textContent = "Don't have an account?";
      this.authToggleBtn.textContent = 'Sign Up';
      if (this.emailAuthBtn) {
        this.emailAuthBtn.textContent = 'Sign In';
      }
    }
  }

  /**
   * Handle email authentication
   * @private
   */
  async _handleEmailAuth() {
    // Validate form
    const isValid = formValidation.validateForm([
      () => formValidation.validateRequired('auth-email', 'Email is required'),
      () => formValidation.validateEmail('auth-email', 'Please enter a valid email address'),
      () => formValidation.validateRequired('auth-password', 'Password is required'),
      () => formValidation.validateMinLength('auth-password', 6, 'Password must be at least 6 characters')
    ]);

    if (!isValid) return;

    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
      // Show loading state
      const authBtn = document.getElementById('email-auth-btn');
      if (authBtn) {
        authBtn.disabled = true;
        authBtn.textContent = this.isSignUp ? 'Creating Account...' : 'Signing In...';
      }

      if (this.isSignUp) {
        // Create account
        await authService.createUserWithEmailPassword(email, password);

        // Get analytics from window
        const analytics = window.firebaseAnalytics;
        if (analytics) {
          analytics.trackEvent('auth_signup', { method: 'email' });
        }
      } else {
        // Sign in
        await authService.signInWithEmailPassword(email, password);

        // Get analytics from window
        const analytics = window.firebaseAnalytics;
        if (analytics) {
          analytics.trackEvent('auth_signin', { method: 'email' });
        }
      }

      // Reset form
      this.authForm.reset();

    } catch (error) {
      console.error('Authentication error:', error);
      alert(`Authentication error: ${error.message}`);

      // Get analytics from window
      const analytics = window.firebaseAnalytics;
      if (analytics) {
        analytics.trackEvent('auth_error', {
          method: 'email',
          error_message: error.message,
          is_signup: this.isSignUp
        });
      }

      // Emit error event
      EventBus.emit('auth:error', error);
    } finally {
      // Reset button state
      const authBtn = document.getElementById('email-auth-btn');
      if (authBtn) {
        authBtn.disabled = false;
        authBtn.textContent = this.isSignUp ? 'Sign Up' : 'Sign In';
      }
    }
  }

  /**
   * Handle Google authentication
   * @private
   */
  async _handleGoogleAuth() {
    try {
      // Show loading state
      if (this.googleAuthBtn) {
        this.googleAuthBtn.disabled = true;
      }

      await authService.signInWithGoogle();

      // Get analytics from window
      const analytics = window.firebaseAnalytics;
      if (analytics) {
        analytics.trackEvent('auth_signin', { method: 'google' });
      }
    } catch (error) {
      console.error('Google authentication error:', error);

      // Only show alert if it's not a user cancel
      if (error.code !== 'auth/cancelled-popup-request' &&
        error.code !== 'auth/popup-closed-by-user') {
        alert(`Google authentication error: ${error.message}`);
      }

      // Get analytics from window
      const analytics = window.firebaseAnalytics;
      if (analytics) {
        analytics.trackEvent('auth_error', {
          method: 'google',
          error_message: error.message
        });
      }

      // Emit error event
      EventBus.emit('auth:error', error);
    } finally {
      // Reset button state
      if (this.googleAuthBtn) {
        this.googleAuthBtn.disabled = false;
      }
    }
  }

  /**
   * Handle Microsoft authentication
   * @private
   */
  async _handleMicrosoftAuth() {
    try {
      // Show loading state
      if (this.microsoftAuthBtn) {
        this.microsoftAuthBtn.disabled = true;
      }

      await authService.signInWithMicrosoft();

      // Get analytics from window
      const analytics = window.firebaseAnalytics;
      if (analytics) {
        analytics.trackEvent('auth_signin', { method: 'microsoft' });
      }
    } catch (error) {
      console.error('Microsoft authentication error:', error);

      // Only show alert if it's not a user cancel
      if (error.code !== 'auth/cancelled-popup-request' &&
        error.code !== 'auth/popup-closed-by-user') {
        alert(`Microsoft authentication error: ${error.message}`);
      }

      // Get analytics from window
      const analytics = window.firebaseAnalytics;
      if (analytics) {
        analytics.trackEvent('auth_error', {
          method: 'microsoft',
          error_message: error.message
        });
      }

      // Emit error event
      EventBus.emit('auth:error', error);
    } finally {
      // Reset button state
      if (this.microsoftAuthBtn) {
        this.microsoftAuthBtn.disabled = false;
      }
    }
  }

  /**
   * Handle skip authentication
   * @private
   */
  _handleSkipAuth() {
    EventBus.emit('auth:skip');

    // Get analytics from window
    const analytics = window.firebaseAnalytics;
    if (analytics) {
      analytics.trackEvent('auth_skip');
    }
  }

  /**
   * Show the authentication view
   */
  show() {
    if (this.viewElement) {
      this.viewElement.classList.remove('hidden');
    }

    // Get analytics from window
    const analytics = window.firebaseAnalytics;
    if (analytics) {
      analytics.trackPageView('auth');
    }
  }

  /**
   * Hide the authentication view
   */
  hide() {
    if (this.viewElement) {
      this.viewElement.classList.add('hidden');
    }
  }
}

// Create and export instance
export default new AuthView();
