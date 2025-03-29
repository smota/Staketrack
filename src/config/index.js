/**
 * Application configuration
 * Contains environment-specific settings, validation rules, and defaults
 */

// Check for required Firebase config and log warnings if missing
const requiredFirebaseKeys = [
  'APP_FIREBASE_API_KEY',
  'APP_FIREBASE_AUTH_DOMAIN',
  'APP_FIREBASE_PROJECT_ID'
]

// Log warning only in development mode
if (process.env.NODE_ENV === 'development') {
  requiredFirebaseKeys.forEach(key => {
    if (!process.env[key]) {
      console.warn(`Missing required Firebase configuration: ${key}`)
    }
  })
}

const config = {
  // Version information
  version: process.env.APP_VERSION || '1.0.0',

  // Environment-specific configuration
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    apiUrl: process.env.APP_API_URL || '',
    firebaseConfig: {
      apiKey: process.env.APP_FIREBASE_API_KEY || '',
      authDomain: process.env.APP_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.APP_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.APP_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.APP_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.APP_FIREBASE_APP_ID || '',
      measurementId: process.env.APP_FIREBASE_MEASUREMENT_ID || ''
    },
    useEmulators: process.env.APP_USE_EMULATORS === 'true',
    firebase: {
      functionsRegion: process.env.APP_FIREBASE_FUNCTIONS_REGION || 'europe-west1'
    }
  },

  // AI Configuration
  ai: {
    enabled: process.env.APP_AI_ENABLED === 'true',
    model: process.env.APP_AI_MODEL || 'gemini-1.5-pro',
    weeklyLimit: parseInt(process.env.APP_AI_WEEKLY_LIMIT || '10', 10)
  },

  // Validation rules
  validation: {
    stakeholder: {
      // Maximum text field lengths
      nameMaxLength: 100,
      interestsMaxLength: 500,
      contributionMaxLength: 500,
      riskMaxLength: 500,
      communicationMaxLength: 500,
      strategyMaxLength: 500,
      measurementMaxLength: 500,

      // Maximum number of stakeholders per map
      maxStakeholdersPerMap: 50,

      // Interaction validation
      interaction: {
        notesMaxLength: 1000,
        maxInteractionsPerStakeholder: 50
      }
    },

    stakeholderMap: {
      nameMaxLength: 100,
      descriptionMaxLength: 1000,
      maxMapsPerUser: 20
    }
  },

  // Default values
  defaults: {
    stakeholder: {
      name: 'New Stakeholder',
      influence: 5,
      impact: 5,
      relationship: 5,
      category: 'other',
      interests: '',
      contribution: '',
      risk: '',
      communication: '',
      strategy: '',
      measurement: ''
    },

    stakeholderMap: {
      name: 'New Stakeholder Map',
      description: ''
    }
  },

  // Feature flags
  features: {
    enableAIRecommendations: true,
    enableSharing: true,
    enableTemplates: true
  },

  // UI configuration
  ui: {
    // Color coding for influence/impact matrix
    quadrantColors: {
      'manage-closely': '#FF5252', // Red
      'keep-satisfied': '#FFB74D', // Orange
      'keep-informed': '#4CAF50', // Green
      'monitor': '#90CAF9' // Blue
    },

    // Default view settings
    defaultView: 'grid',
    pageSize: 10,

    // Relationship status colors
    relationshipColors: {
      strong: '#4CAF50', // Green
      neutral: '#FFC107', // Amber
      weak: '#F44336' // Red
    }
  }
}

export default config
