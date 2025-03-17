import { EventBus } from '../utils/eventBus.js';
import authService from '../services/authService.js';
import { analytics } from '../../firebase/firebaseConfig.js';

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
      await this._handleEmailAuth();
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
  async _handleEmailAuth() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
      alert('Please enter email and password.');
      return;
    }

    try {
      // Show loading state
      this.emailAuthBtn.disabled = true;
      this.emailAuthBtn.textContent = this.isSignUp ? 'Creating Account...' : 'Signing In...';

      if (this.isSignUp) {
        // Create account
        await authService.createUserWithEmailPassword(email, password);

        analytics.logEvent('sign_up', { method: 'email' });
      } else {
        // Sign in
        await authService.signInWithEmailPassword(email, password);

        analytics.logEvent('login', { method: 'email' });
      }

      // Reset form
      this.authForm.reset();

    } catch (error) {
      console.error('Authentication error:', error);
      alert(`Authentication error: ${error.message}`);

      analytics.logEvent('auth_error', {
        method: 'email',
        error_message: error.message,
        is_signup: this.isSignUp
      });
    } finally {
      // Reset button state
      this.emailAuthBtn.disabled = false;
      this.emailAuthBtn.textContent = this.isSignUp ? 'Sign Up' : 'Sign In';
    }
  }

  /**
   * Handle Google authentication
   * @private
   */
  async _handleGoogleAuth() {
    try {
      // Show loading state
      this.googleAuthBtn.disabled = true;

      await authService.signInWithGoogle();

      analytics.logEvent('login', { method: 'google' });
    } catch (error) {
      console.error('Google authentication error:', error);

      // Only show alert if it's not a user cancel
      if (error.code !== 'auth/cancelled-popup-request' &&
        error.code !== 'auth/popup-closed-by-user') {
        alert(`Google authentication error: ${error.message}`);
      }

      analytics.logEvent('auth_error', {
        method: 'google',
        error_message: error.message
      });
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
    try {
      // Show loading state
      this.microsoftAuthBtn.disabled = true;

      await authService.signInWithMicrosoft();

      analytics.logEvent('login', { method: 'microsoft' });
    } catch (error) {
      console.error('Microsoft authentication error:', error);

      // Only show alert if it's not a user cancel
      if (error.code !== 'auth/cancelled-popup-request' &&
        error.code !== 'auth/popup-closed-by-user') {
        alert(`Microsoft authentication error: ${error.message}`);
      }

      analytics.logEvent('auth_error', {
        method: 'microsoft',
        error_message: error.message
      });
    } finally {
      // Reset button state
      this.microsoftAuthBtn.disabled = false;
    }
  }
}

// Singleton instance
export default new AuthController();
