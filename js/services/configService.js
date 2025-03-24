class ConfigService {
  constructor() {
    this.config = null;
    this.isFirebaseAvailable = false;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this.config;

    try {
      // Try to load config from API
      const response = await fetch('/api/get-config?env=development');
      if (!response.ok) {
        throw new Error('Failed to load configuration');
      }
      const apiConfig = await response.json();

      // Validate config
      if (!this._validateConfig(apiConfig)) {
        console.warn('Primary config validation failed, attempting fallback...');
        return this._loadFallbackConfig();
      }

      // Update config
      this.config = apiConfig;
      this.isFirebaseAvailable = this._checkFirebaseAvailability();
      this.initialized = true;

      // Store valid config in localStorage
      try {
        localStorage.setItem('staketrack_config', JSON.stringify(this.config));
      } catch (error) {
        console.warn('Failed to store config in localStorage:', error);
      }

      return this.config;
    } catch (error) {
      console.warn('Error loading configuration from API:', error);
      return this._loadFallbackConfig();
    }
  }

  _validateConfig(config) {
    if (!config) return false;
    if (!config.environment) return false;
    if (!config.firebase) return false;
    if (!config.firebase.apiKey || !config.firebase.authDomain || !config.firebase.projectId) return false;
    return true;
  }

  _checkFirebaseAvailability() {
    try {
      return !!(this.config?.firebase?.apiKey &&
        this.config?.firebase?.authDomain &&
        this.config?.firebase?.projectId);
    } catch (error) {
      console.warn('Error checking Firebase availability:', error);
      return false;
    }
  }

  _loadFallbackConfig() {
    // Default fallback config
    const fallbackConfig = {
      environment: 'development',
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
      }
    };

    try {
      // Try to load from localStorage first
      const storedConfig = localStorage.getItem('staketrack_config');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        if (this._validateConfig(parsedConfig)) {
          this.config = parsedConfig;
          this.isFirebaseAvailable = this._checkFirebaseAvailability();
          this.initialized = true;
          return this.config;
        }
      }
    } catch (error) {
      console.warn('Error loading fallback config from localStorage:', error);
    }

    // If we get here, use the default fallback config
    this.config = fallbackConfig;
    this.isFirebaseAvailable = this._checkFirebaseAvailability();
    this.initialized = true;
    return this.config;
  }

  isFeatureEnabled(feature) {
    return this.config?.features?.[feature] || false;
  }

  getConfig() {
    if (!this.initialized) {
      console.warn('Config not initialized, using fallback');
      return this._loadFallbackConfig();
    }
    return this.config;
  }

  getFirebaseConfig() {
    if (!this.config?.firebase) {
      return null;
    }
    return { ...this.config.firebase };
  }
}

export const configService = new ConfigService(); 