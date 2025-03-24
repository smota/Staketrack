// import { analytics } from '../../../firebase/firebaseConfig.js';
import authService from './authService.js';
import { configService } from './configService.js';

/**
 * Analytics Service - Handles application analytics and tracking
 */
class AnalyticsService {
  constructor() {
    this.initialized = false;
    this.record = null;
    this.enabled = true;
    this.anonymousId = this._generateAnonymousId();
    this._initFromLocalStorage();
    this._initializeFallbackAnalytics();
  }

  /**
   * Initialize from local storage settings
   * @private
   */
  _initFromLocalStorage() {
    try {
      const storedPreference = localStorage.getItem('staketrack_analytics_enabled');
      if (storedPreference !== null) {
        this.enabled = storedPreference === 'true';
      }
    } catch (e) {
      console.warn('Error accessing local storage for analytics preferences:', e);
    }
  }

  /**
   * Generate an anonymous ID for unauthenticated users
   * @returns {string} - Anonymous ID
   * @private
   */
  _generateAnonymousId() {
    try {
      // Try to get stored anonymous ID
      const storedId = localStorage.getItem('staketrack_anonymous_id');
      if (storedId) return storedId;

      // Generate new ID
      const newId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('staketrack_anonymous_id', newId);
      return newId;
    } catch (e) {
      // Fallback if localStorage is not available
      return 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  /**
   * Enable analytics tracking
   */
  enable() {
    this.enabled = true;
    try {
      localStorage.setItem('staketrack_analytics_enabled', 'true');
    } catch (e) {
      console.warn('Error saving analytics preference to local storage:', e);
    }
  }

  /**
   * Disable analytics tracking
   */
  disable() {
    this.enabled = false;
    try {
      localStorage.setItem('staketrack_analytics_enabled', 'false');
    } catch (e) {
      console.warn('Error saving analytics preference to local storage:', e);
    }
  }

  /**
   * Check if analytics is enabled
   * @returns {boolean} - Whether analytics is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Set user ID for analytics
   * @param {string} userId - User ID
   */
  setUserId(userId) {
    if (!this.enabled) return;

    const analytics = window.firebaseAnalytics;
    if (analytics && typeof analytics.setUserId === 'function') {
      analytics.setUserId(userId);
    }
  }

  /**
   * Clear user ID for analytics
   */
  clearUserId() {
    if (!this.enabled) return;

    const analytics = window.firebaseAnalytics;
    if (analytics && typeof analytics.setUserId === 'function') {
      analytics.setUserId(null);
    }
  }

  /**
   * Set user properties for analytics
   * @param {Object} properties - User properties
   */
  setUserProperties(properties) {
    if (!this.enabled) return;

    const analytics = window.firebaseAnalytics;
    if (analytics && typeof analytics.setUserProperties === 'function') {
      analytics.setUserProperties(properties);
    }
  }

  /**
   * Track application event
   * @param {string} eventName - Event name
   * @param {Object} [params={}] - Event parameters
   */
  trackEvent(eventName, params = {}) {
    if (!this.enabled) return;

    // Add user ID if available
    const enhancedParams = { ...params };

    if (authService.isAuthenticated()) {
      enhancedParams.user_id = authService.getCurrentUser().uid;
    } else {
      enhancedParams.anonymous_id = this.anonymousId;
    }

    // Add timestamp
    enhancedParams.timestamp = Date.now();

    // Get analytics from window and log event
    const analytics = window.firebaseAnalytics;
    if (analytics && typeof analytics.logEvent === 'function') {
      analytics.logEvent(eventName, enhancedParams);
    }
  }

  /**
   * Track page view
   * @param {string} pageName - Page name
   * @param {Object} [params={}] - Additional parameters
   */
  trackPageView(pageName, params = {}) {
    if (!this.enabled) return;

    this.trackEvent('page_view', {
      page_name: pageName,
      ...params
    });
  }

  /**
   * Track stakeholder action
   * @param {string} action - Action name (e.g., 'create', 'update', 'delete')
   * @param {string} stakeholderId - Stakeholder ID
   * @param {Object} [params={}] - Additional parameters
   */
  trackStakeholderAction(action, stakeholderId, params = {}) {
    if (!this.enabled) return;

    this.trackEvent(`stakeholder_${action}`, {
      stakeholder_id: stakeholderId,
      ...params
    });
  }

  /**
   * Track map action
   * @param {string} action - Action name (e.g., 'create', 'update', 'delete')
   * @param {string} mapId - Map ID
   * @param {Object} [params={}] - Additional parameters
   */
  trackMapAction(action, mapId, params = {}) {
    if (!this.enabled) return;

    this.trackEvent(`map_${action}`, {
      map_id: mapId,
      ...params
    });
  }

  /**
   * Track LLM request
   * @param {string} requestType - Request type (e.g., 'stakeholder_advice', 'map_recommendations')
   * @param {Object} [params={}] - Additional parameters
   */
  trackLLMRequest(requestType, params = {}) {
    if (!this.enabled) return;

    this.trackEvent('llm_request', {
      request_type: requestType,
      ...params
    });
  }

  /**
   * Track error event
   * @param {string} errorType - Error type
   * @param {string} errorMessage - Error message
   * @param {Object} [params={}] - Additional parameters
   */
  trackError(errorType, errorMessage, params = {}) {
    if (!this.enabled) return;

    this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      ...params
    });
  }

  /**
   * Track feature usage
   * @param {string} featureName - Feature name
   * @param {Object} [params={}] - Additional parameters
   */
  trackFeatureUsage(featureName, params = {}) {
    if (!this.enabled) return;

    this.trackEvent('feature_usage', {
      feature_name: featureName,
      ...params
    });
  }

  _initializeFallbackAnalytics() {
    // Always initialize fallback analytics first
    this.record = (eventName, params) => {
      this._recordToLocalStorage(eventName, params);
    };
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const config = await configService.initialize();

      // Try to initialize Firebase analytics if available
      if (configService.isFeatureEnabled('analytics') && configService.isFirebaseAvailable) {
        if (window.firebaseAnalytics) {
          const firebaseRecord = (eventName, params) => {
            try {
              window.firebaseAnalytics.logEvent(eventName, params);
            } catch (error) {
              console.warn('Firebase analytics error, falling back to local storage:', error);
              this._recordToLocalStorage(eventName, params);
            }
          };
          this.record = firebaseRecord;
        }
      }

      this.initialized = true;
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
      // Ensure fallback is always available
      this._initializeFallbackAnalytics();
    }
  }

  _recordToLocalStorage(eventName, params) {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push({
        name: eventName,
        params: params,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to record analytics event to localStorage:', error);
    }
  }

  logEvent(eventName, params = {}) {
    if (!this.enabled) return;

    try {
      // Add user ID if available
      const enhancedParams = { ...params };
      if (authService.isAuthenticated()) {
        enhancedParams.user_id = authService.getCurrentUser().uid;
      } else {
        enhancedParams.anonymous_id = this.anonymousId;
      }

      // Add timestamp
      enhancedParams.timestamp = Date.now();

      // Use the record function (either Firebase or fallback)
      if (this.record) {
        this.record(eventName, enhancedParams);
      } else {
        this._recordToLocalStorage(eventName, enhancedParams);
      }
    } catch (error) {
      console.warn('Failed to record analytics event:', error);
      this._recordToLocalStorage(eventName, params);
    }
  }
}

// Export a singleton instance
export const analyticsService = new AnalyticsService();
