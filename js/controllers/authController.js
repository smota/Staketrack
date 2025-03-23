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
  }

  /**
   * Initialize the controller
   */
  init() {
    this._initEventListeners();

    // Subscribe to auth events from the EventBus
    EventBus.on('auth:login', this._handleLoginSuccess.bind(this));
    EventBus.on('auth:logout', this._handleLogout.bind(this));
    EventBus.on('auth:error', this._handleAuthError.bind(this));

    // Check if Firebase is properly configured
    this._checkFirebaseConfig();
  }

  /**
   * Check if Firebase is properly configured and show warning if not
   * @private
   */
  _checkFirebaseConfig() {
    // Check if window.firebaseConfig exists and has isConfigured property
    if (window.firebaseConfig && window.firebaseConfig.isConfigured === false) {
      console.warn('Firebase is not properly configured. Some authentication features may not work.');

      // Add a warning message to the auth view
      const warningDiv = document.createElement('div');
      warningDiv.className = 'auth-warning';
      warningDiv.style.color = '#f44336';
      warningDiv.style.padding = '10px';
      warningDiv.style.marginBottom = '15px';
      warningDiv.style.backgroundColor = '#ffebee';
      warningDiv.style.borderRadius = '4px';
      warningDiv.textContent = 'Firebase authentication is not configured. You can still use the app without signing in.';

      // Insert at the top of the auth container
      const authContainer = this.authView.querySelector('.auth-container');
      if (authContainer) {
        authContainer.insertBefore(warningDiv, authContainer.firstChild);
      }
    }
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Form submit - Use event delegation to avoid conflicts with authView
    if (this.authForm) {
      this.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this._handleEmailAuth(e);
      });
    }

    // Toggle sign in/sign up
    if (this.authToggleBtn) {
      this.authToggleBtn.addEventListener('click', () => {
        this.isSignUp = !this.isSignUp;
        this._updateAuthFormState();
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
  }

  /**
   * Handle skip authentication action
   * @private
   */
  _handleSkipAuth() {
    console.log('Skip auth button clicked');

    // Hide auth view
    if (this.authView) {
      this.authView.classList.add('hidden');
    }

    // Get analytics from window
    const analytics = window.firebaseAnalytics;
    if (analytics && typeof analytics.logEvent === 'function') {
      analytics.logEvent('auth_skip');
    }

    // Emit auth skip event
    EventBus.emit('auth:skip');

    // Add direct access to appController as a fallback
    try {
      // Import it dynamically to avoid circular dependency
      import('../controllers/appController.js').then(module => {
        const appController = module.default;
        if (appController && typeof appController.skipAuth === 'function') {
          console.log('Calling appController.skipAuth() directly');
          appController.skipAuth();
        }
      }).catch(err => {
        console.error('Error importing appController:', err);
      });
    } catch (error) {
      console.error('Error in skip auth fallback:', error);
    }

    console.log('Continue without signing in completed');
  }

  /**
   * Handle login success event
   * @param {Object} user - The authenticated user
   * @private
   */
  _handleLoginSuccess(user) {
    // Hide auth view
    if (this.authView) {
      this.authView.classList.add('hidden');
    }

    // Reset form
    if (this.authForm) {
      this.authForm.reset();
    }

    console.log('User logged in successfully:', user.email);
  }

  /**
   * Handle logout event
   * @private
   */
  _handleLogout() {
    console.log('User logged out');
  }

  /**
   * Handle authentication error
   * @param {Object} error - The error object
   * @private
   */
  _handleAuthError(error) {
    console.error('Authentication error:', error);

    // More user-friendly error message
    let errorMessage = 'Authentication failed. Please try again.';

    if (error.code === 'auth/invalid-api-key') {
      errorMessage = 'Firebase configuration error. Please contact the administrator.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    alert(`Authentication error: ${errorMessage}`);

    // Get analytics from window
    const analytics = window.firebaseAnalytics;
    if (analytics && typeof analytics.logEvent === 'function') {
      analytics.logEvent('auth_error', {
        error_code: error.code || 'unknown',
        error_message: error.message || 'Unknown error'
      });
    }
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

        if (analytics && typeof analytics.logEvent === 'function') {
          analytics.logEvent('sign_up', { method: 'email' });
        }
      } else {
        // Sign in
        await authService.signInWithEmailPassword(email, password);

        if (analytics && typeof analytics.logEvent === 'function') {
          analytics.logEvent('login', { method: 'email' });
        }
      }

      // Reset form
      this.authForm.reset();
    } catch (error) {
      console.error('Email authentication error:', error);

      // Format a user-friendly error message
      let errorMessage = 'Authentication failed. Please try again.';

      // Map common Firebase error codes to user-friendly messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use. Please sign in or use a different email.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Firebase configuration error. Please contact the administrator.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show error to user
      alert(`Authentication error: ${errorMessage}`);

      if (analytics && typeof analytics.logEvent === 'function') {
        analytics.logEvent('auth_error', {
          method: 'email',
          error_code: error.code || 'unknown',
          error_message: error.message || 'Unknown error',
          is_signup: this.isSignUp
        });
      }

      // Emit auth error event
      EventBus.emit('auth:error', error);
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

      if (analytics && typeof analytics.logEvent === 'function') {
        analytics.logEvent('login', { method: 'google' });
      }
    } catch (error) {
      console.error('Google authentication error:', error);

      // Handle user cancellation vs. error
      if (error.code !== 'auth/cancelled-popup-request' &&
        error.code !== 'auth/popup-closed-by-user') {

        // Format a user-friendly error message
        let errorMessage = 'Google authentication failed.';

        if (error.code === 'auth/invalid-api-key') {
          errorMessage = 'Firebase configuration error. Please contact the administrator.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        alert(`Google authentication error: ${errorMessage}`);
      }

      if (analytics && typeof analytics.logEvent === 'function') {
        analytics.logEvent('auth_error', {
          method: 'google',
          error_code: error.code || 'unknown',
          error_message: error.message || 'Unknown error'
        });
      }

      // Emit auth error event
      EventBus.emit('auth:error', error);
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

      if (analytics && typeof analytics.logEvent === 'function') {
        analytics.logEvent('login', { method: 'microsoft' });
      }
    } catch (error) {
      console.error('Microsoft authentication error:', error);

      // Handle user cancellation vs. error
      if (error.code !== 'auth/cancelled-popup-request' &&
        error.code !== 'auth/popup-closed-by-user') {

        // Format a user-friendly error message
        let errorMessage = 'Microsoft authentication failed.';

        if (error.code === 'auth/invalid-api-key') {
          errorMessage = 'Firebase configuration error. Please contact the administrator.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        alert(`Microsoft authentication error: ${errorMessage}`);
      }

      if (analytics && typeof analytics.logEvent === 'function') {
        analytics.logEvent('auth_error', {
          method: 'microsoft',
          error_code: error.code || 'unknown',
          error_message: error.message || 'Unknown error'
        });
      }

      // Emit auth error event
      EventBus.emit('auth:error', error);
    } finally {
      // Reset button state
      this.microsoftAuthBtn.disabled = false;
    }
  }
}

// Singleton instance
export default new AuthController();
