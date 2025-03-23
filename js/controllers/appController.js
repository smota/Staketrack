import { EventBus } from '../utils/eventBus.js';
import dataService from '../services/dataService.js';
import authService from '../services/authService.js';
// import { analytics } from '../../firebase/firebaseConfig.js';

/**
 * Application Controller - Main application coordinator
 */
export class AppController {
  constructor() {
    this.views = {
      auth: document.getElementById('auth-view'),
      dashboard: document.getElementById('dashboard-view'),
      map: document.getElementById('map-view')
    };

    this.navElements = {
      mapsDropdown: document.getElementById('maps-dropdown'),
      mapsDropdownContainer: document.getElementById('maps-dropdown-container'),
      userProfile: document.getElementById('user-profile'),
      userEmail: document.getElementById('user-email'),
      loginBtn: document.getElementById('login-btn'),
      logoutBtn: document.getElementById('logout-btn')
    };

    this.currentView = null;

    this._initEventListeners();
  }

  /**
   * Initialize application
   */
  async init() {
    // Wait for authentication to be initialized
    await authService.waitForInitialization();

    // Initialize analytics
    this._initAnalytics();

    // Determine initial view
    this._determineInitialView();
  }

  /**
   * Initialize analytics tracking
   * @private
   */
  _initAnalytics() {
    // Access analytics from window
    const analytics = window.firebaseAnalytics;
    if (analytics && typeof analytics.logEvent === 'function') {
      analytics.logEvent('app_initialized');

      // Set user ID if authenticated
      if (authService.isAuthenticated()) {
        analytics.setUserId(authService.getCurrentUser().uid);
      }
    }
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initEventListeners() {
    // Authentication events
    EventBus.on('auth:login', user => {
      this._updateAuthUI(user);
      this._loadUserData();
    });

    EventBus.on('auth:logout', () => {
      this._updateAuthUI(null);
      this.showView('auth');
    });

    // Handle auth:skip event
    EventBus.on('auth:skip', () => {
      this.skipAuth();
    });

    // Map events
    EventBus.on('map:current-changed', map => {
      this._updateMapsDropdown();
      this.showView('map');
    });

    EventBus.on('map:created', map => {
      this._updateMapsDropdown();
      dataService.setCurrentMap(map.id);
    });

    EventBus.on('map:updated', map => {
      this._updateMapsDropdown();
    });

    EventBus.on('map:deleted', mapId => {
      this._updateMapsDropdown();

      // If no maps left, show dashboard view
      if (dataService.getAllMaps().length === 0) {
        this.showView('dashboard');
      }
    });

    // UI event listeners
    this.navElements.loginBtn.addEventListener('click', () => {
      this.showView('auth');
    });

    this.navElements.logoutBtn.addEventListener('click', () => {
      authService.signOut();
    });

    this.navElements.mapsDropdown.addEventListener('change', (e) => {
      const mapId = e.target.value;
      if (mapId) {
        dataService.setCurrentMap(mapId);
      }
    });

    // Skip auth button - now handled by authController and auth:skip event
    // document.getElementById('skip-auth-btn').addEventListener('click', () => {
    //   this.skipAuth();
    // });
  }

  /**
   * Skip authentication and proceed as guest
   */
  skipAuth() {
    // Access analytics from window
    const analytics = window.firebaseAnalytics;

    // Updates UI to show login button instead of user profile
    this._updateAuthUI(null);

    // Check if there are any maps
    if (dataService.getAllMaps().length > 0) {
      // If there's a current map, show map view
      const currentMap = dataService.getCurrentMap();
      if (currentMap) {
        this.showView('map');
      } else {
        // Otherwise, show dashboard
        this.showView('dashboard');
      }
    } else {
      // If no maps, show dashboard
      this.showView('dashboard');
    }

    // Log skip auth event
    if (analytics && typeof analytics.logEvent === 'function') {
      analytics.logEvent('skip_auth');
    }
  }

  /**
   * Determine the initial view to show
   * @private
   */
  _determineInitialView() {
    // If user is authenticated, load their maps
    if (authService.isAuthenticated()) {
      this._updateAuthUI(authService.getCurrentUser());
      this._loadUserData();
    } else {
      // Check if there are any maps in local storage
      const maps = dataService.getAllMaps();

      if (maps.length > 0) {
        // If there's a current map, show map view
        const currentMap = dataService.getCurrentMap();
        if (currentMap) {
          this.showView('map');
        } else {
          // Otherwise, show dashboard
          this.showView('dashboard');
        }
      } else {
        // If no maps, show auth view
        this.showView('auth');
      }
    }
  }

  /**
   * Update authentication UI
   * @param {Object|null} user - Firebase user object or null if not authenticated
   * @private
   */
  _updateAuthUI(user) {
    if (user) {
      // Show user profile
      this.navElements.userProfile.classList.remove('hidden');
      this.navElements.loginBtn.classList.add('hidden');
      this.navElements.userEmail.textContent = user.email;
      this.navElements.mapsDropdownContainer.classList.remove('hidden');
    } else {
      // Show login button
      this.navElements.userProfile.classList.add('hidden');
      this.navElements.loginBtn.classList.remove('hidden');
      this.navElements.userEmail.textContent = '';

      // Still show maps dropdown if there are maps
      if (dataService.getAllMaps().length > 0) {
        this.navElements.mapsDropdownContainer.classList.remove('hidden');
      } else {
        this.navElements.mapsDropdownContainer.classList.add('hidden');
      }
    }

    // Update maps dropdown
    this._updateMapsDropdown();
  }

  /**
   * Load user data from cloud
   * @private
   */
  _loadUserData() {
    // Show dashboard initially while loading
    this.showView('dashboard');

    // Wait for data to sync
    const unsubscribe = EventBus.on('data:synced', maps => {
      unsubscribe();

      // Update maps dropdown
      this._updateMapsDropdown();

      // If there are maps, show the current map or first map
      if (maps.length > 0) {
        const currentMap = dataService.getCurrentMap();
        if (currentMap) {
          this.showView('map');
        } else {
          // Set first map as current if no current map
          dataService.setCurrentMap(maps[0].id);
        }
      }
    });
  }

  /**
   * Update maps dropdown with current maps
   * @private
   */
  _updateMapsDropdown() {
    const dropdown = this.navElements.mapsDropdown;
    const maps = dataService.getAllMaps();
    const currentMapId = dataService.getCurrentMap()?.id;

    // Clear dropdown
    dropdown.innerHTML = '<option value="">Select a map...</option>';

    // Add maps to dropdown
    maps.forEach(map => {
      const option = document.createElement('option');
      option.value = map.id;
      option.text = map.name;

      if (map.id === currentMapId) {
        option.selected = true;
      }

      dropdown.appendChild(option);
    });

    // Show/hide maps dropdown container based on maps existence
    if (maps.length > 0) {
      this.navElements.mapsDropdownContainer.classList.remove('hidden');
    } else {
      this.navElements.mapsDropdownContainer.classList.add('hidden');
    }
  }

  /**
   * Show a specific view
   * @param {string} viewName - The name of the view to show
   */
  showView(viewName) {
    // Hide all views
    Object.values(this.views).forEach(view => {
      view.classList.add('hidden');
    });

    // Show requested view
    if (this.views[viewName]) {
      this.views[viewName].classList.remove('hidden');
      this.currentView = viewName;

      // Log screen view
      const analytics = window.firebaseAnalytics;
      if (analytics && typeof analytics.logEvent === 'function') {
        analytics.logEvent('screen_view', {
          screen_name: viewName
        });
      }
    } else {
      console.error(`View "${viewName}" does not exist`);
    }
  }

  /**
   * Get the current view
   * @returns {string} - The name of the current view
   */
  getCurrentView() {
    return this.currentView;
  }
}

// Singleton instance
export default new AppController();
