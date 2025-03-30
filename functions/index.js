const { https, logger } = require('firebase-functions').region('europe-west1')
const functions = require('firebase-functions').region('europe-west1')

// Basic Hello World function to make sure Functions is initialized properly
exports.helloWorld = https.onRequest((request, response) => {
  logger.info('Hello request received')
  response.send('Hello from Firebase Functions!')
})

// Export the getConfig function - simplified version
exports.getConfig = https.onRequest((request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*')
  response.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.set('Access-Control-Allow-Headers', 'Content-Type')
  response.set('Content-Type', 'application/json')

  if (request.method === 'OPTIONS') {
    // Handle preflight requests
    response.status(204).send('')
    return
  }

  try {
    // Get environment from query parameter or default to production
    const env = request.query.env || 'production'

    // Get Firebase config
    const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {}

    // Get environment variables set via firebase functions:config:set
    const runtimeConfig = require('firebase-functions').config()
    const appConfig = runtimeConfig && runtimeConfig.app ? runtimeConfig.app : {}

    // Build response based on environment
    let config = {
      ENVIRONMENT: env.toUpperCase(),
      TIMESTAMP: new Date().toISOString()
    }

    if (env.toLowerCase() === 'staging') {
      // Staging environment - use Firebase config
      config = {
        ...config,
        FIREBASE_API_KEY: appConfig.api_key || '',
        FIREBASE_AUTH_DOMAIN: appConfig.auth_domain || '',
        FIREBASE_PROJECT_ID: appConfig.project_id || '',
        FIREBASE_STORAGE_BUCKET: appConfig.storage_bucket || '',
        FIREBASE_MESSAGING_SENDER_ID: appConfig.messaging_sender_id || '',
        FIREBASE_APP_ID: appConfig.app_id || '',
        FIREBASE_MEASUREMENT_ID: appConfig.measurement_id || '',
        USE_EMULATORS: 'false'
      }
    } else if (env.toLowerCase() === 'production' || env.toLowerCase() === 'prod') {
      // Production environment - use same approach as staging but could be from different source
      config = {
        ...config,
        FIREBASE_API_KEY: appConfig.api_key || '',
        FIREBASE_AUTH_DOMAIN: appConfig.auth_domain || '',
        FIREBASE_PROJECT_ID: appConfig.project_id || '',
        FIREBASE_STORAGE_BUCKET: appConfig.storage_bucket || '',
        FIREBASE_MESSAGING_SENDER_ID: appConfig.messaging_sender_id || '',
        FIREBASE_APP_ID: appConfig.app_id || '',
        FIREBASE_MEASUREMENT_ID: appConfig.measurement_id || '',
        USE_EMULATORS: 'false'
      }
    } else {
      // Development/other config with emulators
      config = {
        ...config,
        FIREBASE_API_KEY: appConfig.api_key || '',
        FIREBASE_AUTH_DOMAIN: appConfig.auth_domain || '',
        FIREBASE_PROJECT_ID: appConfig.project_id || '',
        FIREBASE_STORAGE_BUCKET: appConfig.storage_bucket || '',
        FIREBASE_MESSAGING_SENDER_ID: appConfig.messaging_sender_id || '',
        FIREBASE_APP_ID: appConfig.app_id || '',
        FIREBASE_MEASUREMENT_ID: appConfig.measurement_id || '',
        USE_EMULATORS: 'true'
      }
    }

    // Add debug info
    if (appConfig && Object.keys(appConfig).length > 0) {
      config.CONFIG_AVAILABLE = true
      config.CONFIG_KEYS = Object.keys(appConfig)
    } else {
      config.CONFIG_AVAILABLE = false
    }

    // Set cache control headers
    response.set('Cache-Control', 'public, max-age=300') // 5 minutes

    // Send the configuration
    response.json(config)
  } catch (error) {
    // Return a safe error response
    response.status(500).json({
      ERROR: 'Configuration error',
      MESSAGE: error.message
    })
  }
})
