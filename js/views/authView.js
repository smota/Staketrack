import { EventBus } from '../utils/eventBus.js';
import authService from '../services/authService.js';
import { formValidation } from '../utils/formValidation.js';
import { analytics } from '../../../firebase/firebaseConfig.js';

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
    
    this.isSignUp = false;
    
    this._initEventListeners();
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
      
      analytics.trackEvent('auth_toggle', {
        mode: this.isSignUp ? 'signup' : 'signin'
      });
    });
    
    // Google sign in
    this.googleAuthBtn.addEventListener('click', async () => {
      await this._handleGoogleAuth();
    });
    
    // Microsoft sign in
    this.microsoftAuthBtn.addEventListener('click', async () => {
      await this._handleMicrosoftAuth();
    });
    
    // Skip auth button
    this.skipAuthBtn.addEventListener('click', () => {
      this._handleSkipAuth();
    });
    
    // Field validation
    document.getElementById('auth-email').addEventListener('blur', () => {
      formValidation.validateEmail('auth-email', 'Please enter a valid email address');
    });
    
    document.getElementById('auth-password').addEventListener('blur', () => {
      formValidation.validateMinLength('auth-password', 6, 'Password must be at least 6 characters');
    });
  }
  
  /**
   * Update authentication form state (sign in/sign up)
   * @private
   */
  _updateAuthFormState() {
    if (this.isSignUp) {
      this.authToggleText.textContent = 'Already have an account?';
      this.authToggleBtn.textContent = 'Sign In';
      document.getElementById('email-auth-btn').textContent = 'Sign Up';
    } else {
      this.authToggleText.textContent = "Don't have an account?";
      this.authToggleBtn.textContent = 'Sign Up';
      document.getElementById('email-auth-btn').textContent = 'Sign In';
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
      authBtn.disabled = true;
      authBtn.textContent = this.isSignUp ? 'Creating Account...' : 'Signing In...';
      
      if (this.isSignUp) {
        // Create account
        await authService.createUserWithEmailPassword(email, password);
        
        analytics.trackEvent('auth_signup', { method: 'email' });
      } else {
        // Sign in
        await authService.signInWithEmailPassword(email, password);
        
        analytics.trackEvent('auth_signin', { method: 'email' });
      }
      
      // Reset form
      this.authForm.reset();
      
    } catch (error) {
      console.error('Authentication error:', error);
      alert(`Authentication error: ${error.message}`);
      
      analytics.trackEvent('auth_error', { 
        method: 'email',
        error_message: error.message,
        is_signup: this.isSignUp
      });
    } finally {
      // Reset button state
      const authBtn = document.getElementById('email-auth-btn');
      authBtn.disabled = false;
      authBtn.textContent = this.isSignUp ? 'Sign Up' : 'Sign In';
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
      
      analytics.trackEvent('auth_signin', { method: 'google' });
    } catch (error) {
      console.error('Google authentication error:', error);
      
      // Only show alert if it's not a user cancel
      if (error.code !== 'auth/cancelled-popup-request' && 
          error.code !== 'auth/popup-closed-by-user') {
        alert(`Google authentication error: ${error.message}`);
      }
      
      analytics.trackEvent('auth_error', { 
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
      
      analytics.trackEvent('auth_signin', { method: 'microsoft' });
    } catch (error) {
      console.error('Microsoft authentication error:', error);
      
      // Only show alert if it's not a user cancel
      if (error.code !== 'auth/cancelled-popup-request' && 
          error.code !== 'auth/popup-closed-by-user') {
        alert(`Microsoft authentication error: ${error.message}`);
      }
      
      analytics.trackEvent('auth_error', { 
        method: 'microsoft',
        error_message: error.message
      });
    } finally {
      // Reset button state
      this.microsoftAuthBtn.disabled = false;
    }
  }
  
  /**
   * Handle skip authentication
   * @private
   */
  _handleSkipAuth() {
    EventBus.emit('auth:skip');
    
    analytics.trackEvent('auth_skip');
  }
  
  /**
   * Show the authentication view
   */
  show() {
    this.viewElement.classList.remove('hidden');
    
    analytics.trackPageView('auth');
  }
  
  /**
   * Hide the authentication view
   */
  hide() {
    this.viewElement.classList.add('hidden');
  }
}

// Create and export instance
export default new AuthView();
