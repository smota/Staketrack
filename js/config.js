/**
 * StakeTrack Application Configuration
 */

// Determine environment (default to development if not specified)
const ENV = process.env.ENVIRONMENT || 'DEV';

// Base configuration shared across environments
const baseConfig = {
  /**
   * Application name
   */
  appName: 'StakeTrack',
  
  /**
   * UI configuration
   */
  ui: {
    /**
     * Default view to show when loading the application
     */
    defaultView: 'auth',
    
    /**
     * Tooltip delay (milliseconds)
     */
    tooltipDelay: 300,
    
    /**
     * Animation durations (milliseconds)
     */
    animations: {
      fast: 150,
      medium: 300,
      slow: 500
    },
    
    /**
     * Sidebar width (pixels)
     */
    sidebarWidth: 320
  },
  
  /**
   * Form validation configuration
   */
  validation: {
    /**
     * Stakeholder field validation rules
     */
    stakeholder: {
      nameMaxLength: 100,
      interestsMaxLength: 1000,
      contributionMaxLength: 1000,
      riskMaxLength: 1000,
      communicationMaxLength: 1000,
      strategyMaxLength: 1000,
      measurementMaxLength: 1000
    },
    
    /**
     * Map field validation rules
     */
    map: {
      nameMaxLength: 100,
      descriptionMaxLength: 500
    }
  },
  
  /**
   * Local storage configuration
   */
  storage: {
    /**
     * Key prefix for local storage items
     */
    keyPrefix: 'staketrack_',
    
    /**
     * Keys for specific storage items
     */
    keys: {
      maps: 'maps',
      currentMapId: 'current_map_id',
      settings: 'settings',
      anonymousId: 'anonymous_id',
      analyticsEnabled: 'analytics_enabled'
    }
  },
  
  /**
   * Defaults for new entities
   */
  defaults: {
    /**
     * Default map data
     */
    map: {
      name: 'New Stakeholder Map',
      description: 'Created on ' + new Date().toLocaleDateString()
    },
    
    /**
     * Default stakeholder data
     */
    stakeholder: {
      name: '',
      influence: 5,
      impact: 5,
      relationship: 5,
      category: 'other',
      interests: '',
      contribution: '',
      risk: '',
      communication: '',
      strategy: '',
      measurement: '',
      interactions: []
    }
  }
};

// Environment-specific configurations
const envConfigs = {
  DEV: {
    version: '1.0.0-dev',
    api: {
      anthropic: {
        version: '2023-06-01',
        endpoint: process.env.ANTHROPIC_API_ENDPOINT || 'https://api.anthropic.com/v1/messages',
        defaultModel: 'claude-3-opus-20240229',
        defaultMaxTokens: 1500
      }
    },
    features: {
      realtimeSync: true,
      aiRecommendations: true,
      analytics: false, // Typically disabled in dev
      dashboard: true
    }
  },
  PRD: {
    version: '1.0.0',
    api: {
      anthropic: {
        version: '2023-06-01',
        endpoint: process.env.ANTHROPIC_API_ENDPOINT || 'https://api.anthropic.com/v1/messages',
        defaultModel: 'claude-3-opus-20240229',
        defaultMaxTokens: 1500
      }
    },
    features: {
      realtimeSync: true,
      aiRecommendations: true,
      analytics: true,
      dashboard: true
    }
  }
};

// Merge base config with environment-specific config
export const config = {
  ...baseConfig,
  ...envConfigs[ENV],
  environment: ENV
};
