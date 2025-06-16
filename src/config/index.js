/**
 * Application configuration
 * Contains environment-specific settings, validation rules, and defaults
 */
import { parseArrayValue, parseBooleanFlag } from './helpers'

// Check for required Firebase config and log warnings if missing
const requiredFirebaseKeys = [
  'VUE_APP_FIREBASE_API_KEY',
  'VUE_APP_FIREBASE_AUTH_DOMAIN',
  'VUE_APP_FIREBASE_PROJECT_ID'
]

// Validate config in a consistent way regardless of environment
const shouldValidateConfig = process.env.VUE_APP_VALIDATE_CONFIG !== 'false'

// Log both the environment and the required keys
console.log('Current environment variables mode:', process.env.NODE_ENV, process.env.VUE_APP_ENVIRONMENT || 'not set')

if (shouldValidateConfig && process.env.VUE_APP_USE_EMULATORS !== 'true' && process.env.VUE_APP_USE_LOCAL_STORAGE !== 'true') {
  requiredFirebaseKeys.forEach(key => {
    if (!process.env[key]) {
      console.warn(`Missing required Firebase configuration: ${key}`)
    }
  })

  // Check if any variables are available
  const appVars = Object.keys(process.env).filter(key => key.startsWith('VUE_APP_'))
  console.log('Available VUE_APP_ environment variables:', appVars.length > 0 ? appVars.join(', ') : 'None found')

  // Debug Firebase config
  console.log('Firebase config debug:', {
    apiKey: process.env.VUE_APP_FIREBASE_API_KEY ? 'Set' : 'Not set',
    authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not set',
    projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID ? 'Set' : 'Not set'
  })
}

const config = {
  // Version information
  version: process.env.VUE_APP_VERSION || '1.0.0',

  // Environment-specific configuration
  env: {
    name: process.env.VUE_APP_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'PRODUCTION' : process.env.NODE_ENV === 'development' ? 'DEVELOPMENT' : 'STAGING'),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isStaging: process.env.NODE_ENV === 'staging' || (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'production'),
    apiUrl: process.env.VUE_APP_API_URL || '',
    firebaseConfig: {
      apiKey: process.env.VUE_APP_FIREBASE_API_KEY || '',
      authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.VUE_APP_FIREBASE_APP_ID || '',
      measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID || ''
    },
    firebase: {
      functionsRegion: process.env.VUE_APP_FIREBASE_FUNCTIONS_REGION || 'europe-west1'
    }
  },

  // Feature flags - all using consistent pattern
  features: {
    useEmulators: parseBooleanFlag(process.env.VUE_APP_USE_EMULATORS, false),
    useLocalStorage: parseBooleanFlag(process.env.VUE_APP_USE_LOCAL_STORAGE, false),
    enableConfigValidation: parseBooleanFlag(process.env.VUE_APP_ENABLE_CONFIG_VALIDATION, true),
    debugLocalStorage: parseBooleanFlag(process.env.VUE_APP_DEBUG_LOCAL_STORAGE, false),
    enableAnalytics: parseBooleanFlag(process.env.VUE_APP_ENABLE_ANALYTICS, false),
    enableAIRecommendations: parseBooleanFlag(process.env.VUE_APP_ENABLE_AI_RECOMMENDATIONS, true),
    enableSharing: parseBooleanFlag(process.env.VUE_APP_ENABLE_SHARING, true),
    enableTemplates: parseBooleanFlag(process.env.VUE_APP_ENABLE_TEMPLATES, true)
  },

  // Debug information - log emulator configuration
  debug: {
    emulators: {
      enabled: parseBooleanFlag(process.env.VUE_APP_USE_EMULATORS, false),
      authPort: process.env.VUE_APP_EMULATOR_AUTH_PORT || '9099',
      firestorePort: process.env.VUE_APP_EMULATOR_FIRESTORE_PORT || '8080',
      functionsPort: process.env.VUE_APP_EMULATOR_FUNCTIONS_PORT || '5001',
      storagePort: process.env.VUE_APP_EMULATOR_STORAGE_PORT || '9199'
    }
  },

  // Security configuration
  security: {
    // Rate limiting configuration
    rateLimit: {
      // API rate limits
      api: {
        maxRequestsPerMinute: parseInt(process.env.VUE_APP_RATE_LIMIT_API_PER_MINUTE, 10) || 60,
        maxRequestsPerHour: parseInt(process.env.VUE_APP_RATE_LIMIT_API_PER_HOUR, 10) || 300,
        maxRequestsPerDay: parseInt(process.env.VUE_APP_RATE_LIMIT_API_PER_DAY, 10) || 1000
      },
      // AI service rate limits
      ai: {
        maxRequestsPerMinute: parseInt(process.env.VUE_APP_RATE_LIMIT_AI_PER_MINUTE, 10) || 5,
        maxRequestsPerDay: parseInt(process.env.VUE_APP_RATE_LIMIT_AI_PER_DAY, 10) || 50,
        weeklyLimit: parseInt(process.env.VUE_APP_AI_WEEKLY_LIMIT, 10) || 10
      }
    },
    // CORS configuration - use environment variable for origins
    cors: {
      allowedOrigins: parseArrayValue(process.env.VUE_APP_CORS_ALLOWED_ORIGINS,
        process.env.NODE_ENV === 'production'
          ? ['https://staketrack-prod.web.app', 'https://staketrack.app']
          : ['http://localhost:8080'])
    }
  },

  // AI Configuration
  ai: {
    enabled: parseBooleanFlag(process.env.VUE_APP_AI_ENABLED, false),
    model: process.env.VUE_APP_AI_MODEL || 'gemini-1.5-pro',
    weeklyLimit: parseInt(process.env.VUE_APP_AI_WEEKLY_LIMIT, 10) || 10
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
