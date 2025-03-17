import { EventBus } from '../utils/eventBus.js';
import authService from '../services/authService.js';
// import { analytics } from '../../firebase/firebaseConfig.js';

/**
 * Authentication Controller - Manages authentication UI and interactions
 */
export class AuthController {
  constructor() {
    this.authView = document.getElementById('auth-view');
    this.authForm = document.getElementById('email-auth-form');
    this.authToggleBtn = document.getElementById('auth-toggle-btn');
    this.authToggleText = document.getElementById('auth-toggle-text');
    this.googleAuthBtn = document.getElementById('google-auth-btn');
    this.microsoftAuthBtn = document.getElementById('microsoft-auth-btn');
    this.emailAuthBtn = document.getElementById('email-auth-btn');
    this.skipAuthBtn = document.getElementById('skip-auth-btn');

    this.isSignUp = false;

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
    // Form submit
    this.authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleEmailAuth(e);
    });

    // Toggle sign in/sign up
    this.authToggleBtn.addEventListener('click', () => {
      this.isSignUp = !this.isSignUp;
      this._updateAuthFormState();
    });

    // Google sign in
    this.googleAuthBtn.addEventListener('click', async () => {
      await this._handleGoogleAuth();
    });

    // Microsoft sign in
    this.microsoftAuthBtn.addEventListener('click', async () => {
      await this._handleMicrosoftAuth();
    });

    // Skip auth button handler is already in app controller
  }

  /**
   * Update auth form state based on sign in/sign up mode
   * @private
   */
  _updateAuthFormState() {
    if (this.isSignUp) {
      this.authToggleText.textContent = 'Already have an account?';
      this.authToggleBtn.textContent = 'Sign In';
      this.emailAuthBtn.textContent = 'Sign Up';
    } else {
      this.authToggleText.textContent = "Don't have an account?";
      this.authToggleBtn.textContent = 'Sign Up';
      this.emailAuthBtn.textContent = 'Sign In';
    }
  }

  /**
   * Handle email authentication
   * @private
   */
  async _handleEmailAuth(event) {
    event.preventDefault();

    // Get analytics from window
    const analytics = window.firebaseAnalytics;

    // Disable form submission
    const submitButton = this.authForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = this.isSignUp ? 'Signing up...' : 'Signing in...';

    try {
      // Get form values
      const email = this.authForm.querySelector('#auth-email').value;
      const password = this.authForm.querySelector('#auth-password').value;

      if (this.isSignUp) {
        // Create account
        await authService.createUserWithEmailPassword(email, password);

        if (analytics) {
          analytics.logEvent('sign_up', { method: 'email' });
        }
      } else {
        // Sign in
        await authService.signInWithEmailPassword(email, password);

        if (analytics) {
          analytics.logEvent('login', { method: 'email' });
        }
      }

      // Reset form
      this.authForm.reset();
    } catch (error) {
      console.error('Email authentication error:', error);

      // Show error to user
      alert(`Authentication error: ${error.message}`);

      if (analytics) {
        analytics.logEvent('auth_error', {
          method: 'email',
          error_message: error.message,
          is_signup: this.isSignUp
        });
      }
    } finally {
      // Reset button state
      submitButton.disabled = false;
      submitButton.textContent = this.isSignUp ? 'Sign Up' : 'Sign In';
    }
  }

  /**
   * Handle Google authentication
   * @private
   */
  async _handleGoogleAuth() {
    // Get analytics from window
    const analytics = window.firebaseAnalytics;

    // Disable button
    this.googleAuthBtn.disabled = true;

    try {
      // Sign in with Google
      await authService.signInWithGoogle();

      if (analytics) {
        analytics.logEvent('login', { method: 'google' });
      }
    } catch (error) {
      console.error('Google authentication error:', error);

      // Handle user cancellation vs. error
      if (error.code !== 'auth/cancelled-popup-request' &&
        error.code !== 'auth/popup-closed-by-user') {
        alert(`Google authentication error: ${error.message}`);
      }

      if (analytics) {
        analytics.logEvent('auth_error', {
          method: 'google',
          error_message: error.message
        });
      }
    } finally {
      // Reset button state
      this.googleAuthBtn.disabled = false;
    }
  }

  /**
   * Handle Microsoft authentication
   * @private
   */
  async _handleMicrosoftAuth() {
    // Get analytics from window
    const analytics = window.firebaseAnalytics;

    // Disable button
    this.microsoftAuthBtn.disabled = true;

    try {
      // Sign in with Microsoft
      await authService.signInWithMicrosoft();

      if (analytics) {
        analytics.logEvent('login', { method: 'microsoft' });
      }
    } catch (error) {
      console.error('Microsoft authentication error:', error);

      // Handle user cancellation vs. error
      if (error.code !== 'auth/cancelled-popup-request' &&
        error.code !== 'auth/popup-closed-by-user') {
        alert(`Microsoft authentication error: ${error.message}`);
      }

      if (analytics) {
        analytics.logEvent('auth_error', {
          method: 'microsoft',
          error_message: error.message
        });
      }
    } finally {
      // Reset button state
      this.microsoftAuthBtn.disabled = false;
    }
  }
}

// Singleton instance
export default new AuthController();
