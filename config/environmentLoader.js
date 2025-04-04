/**
 * Environment variables loader
 * Securely loads environment variables for Firebase configuration
 */

// Create an environment object to export
const envData = {}
export const env = envData

// Initialize window.ENV
window.ENV = window.ENV || {}

/**
 * Fetches the Firebase configuration
 * Always uses environment variables via API for all environments
 */
async function fetchFirebaseConfig() {
  try {
    // Get the current hostname to determine environment
    const hostname = window.location.hostname
    let configSource
    let envName

    // Determine environment based on hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local development - use API endpoint with development parameter
      configSource = '/api/get-config?env=development'
      envName = 'development'
    } else if (hostname.includes('staketrack-dev.web.app') || hostname.includes('staketrack-dev.firebaseapp.com')) {
      // Staging environment - use API endpoint
      configSource = '/api/get-config?env=staging'
      envName = 'staging'
    } else if (hostname.includes('staketrack.com') || hostname.includes('staketrack.web.app')) {
      // Production environment - use API endpoint
      configSource = '/api/get-config?env=production'
      envName = 'production'
    } else {
      // Default - assume staging
      configSource = '/api/get-config?env=staging'
      envName = 'staging'
    }

    console.log(`Loading configuration for ${envName} environment from ${configSource}`)

    // Try to fetch the configuration
    try {
      const response = await fetch(configSource)

      if (!response.ok) {
        throw new Error(`Failed to fetch configuration: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got: ${contentType}`)
      }

      const config = await response.json()

      // Check if we're getting the updated client.* config format
      if (config.FIREBASE_API_KEY) {
        // Old format - use as is
        // Make sure the config has the required fields
        if (!config.FIREBASE_API_KEY || !config.FIREBASE_PROJECT_ID) {
          throw new Error('Incomplete configuration received from server')
        }
      }
      else if (config.CLIENT_CONFIG_KEYS && Array.isArray(config.CLIENT_CONFIG_KEYS)) {
        // New format with client.* prefixes - map to expected APP_ prefixes
        // Convert client config keys to APP_ format
        console.log('Received updated configuration format with client prefixes')

        // Map client properties to expected APP variables
        if (config.FIREBASE_API_KEY === undefined && config.firebase_api_key) {
          config.FIREBASE_API_KEY = config.firebase_api_key
        }
        if (config.FIREBASE_AUTH_DOMAIN === undefined && config.firebase_auth_domain) {
          config.FIREBASE_AUTH_DOMAIN = config.firebase_auth_domain
        }
        if (config.FIREBASE_PROJECT_ID === undefined && config.firebase_project_id) {
          config.FIREBASE_PROJECT_ID = config.firebase_project_id
        }
        if (config.FIREBASE_STORAGE_BUCKET === undefined && config.firebase_storage_bucket) {
          config.FIREBASE_STORAGE_BUCKET = config.firebase_storage_bucket
        }
        if (config.FIREBASE_MESSAGING_SENDER_ID === undefined && config.firebase_messaging_sender_id) {
          config.FIREBASE_MESSAGING_SENDER_ID = config.firebase_messaging_sender_id
        }
        if (config.FIREBASE_APP_ID === undefined && config.firebase_app_id) {
          config.FIREBASE_APP_ID = config.firebase_app_id
        }
        if (config.FIREBASE_MEASUREMENT_ID === undefined && config.firebase_measurement_id) {
          config.FIREBASE_MEASUREMENT_ID = config.firebase_measurement_id
        }

        // Map to APP_FIREBASE format
        config.APP_FIREBASE_API_KEY = config.FIREBASE_API_KEY
        config.APP_FIREBASE_AUTH_DOMAIN = config.FIREBASE_AUTH_DOMAIN
        config.APP_FIREBASE_PROJECT_ID = config.FIREBASE_PROJECT_ID
        config.APP_FIREBASE_STORAGE_BUCKET = config.FIREBASE_STORAGE_BUCKET
        config.APP_FIREBASE_MESSAGING_SENDER_ID = config.FIREBASE_MESSAGING_SENDER_ID
        config.APP_FIREBASE_APP_ID = config.FIREBASE_APP_ID
        config.APP_FIREBASE_MEASUREMENT_ID = config.FIREBASE_MEASUREMENT_ID
        config.APP_USE_EMULATORS = config.USE_EMULATORS || 'false'

        // AI Settings
        if (config.AI_ENABLED) {
          config.APP_AI_ENABLED = config.AI_ENABLED
          config.APP_AI_MODEL = config.AI_MODEL
          config.APP_AI_WEEKLY_LIMIT = config.AI_WEEKLY_LIMIT
        }

        // Make sure we have required fields
        if (!config.APP_FIREBASE_API_KEY || !config.APP_FIREBASE_PROJECT_ID) {
          console.warn('Some required Firebase config values are missing')
          config.CONFIG_INCOMPLETE = true
        }
      }

      // For compatibility with old variables, ensure we have both formats
      if (config.APP_FIREBASE_API_KEY && !config.FIREBASE_API_KEY) {
        config.FIREBASE_API_KEY = config.APP_FIREBASE_API_KEY
        config.FIREBASE_AUTH_DOMAIN = config.APP_FIREBASE_AUTH_DOMAIN
        config.FIREBASE_PROJECT_ID = config.APP_FIREBASE_PROJECT_ID
        config.FIREBASE_STORAGE_BUCKET = config.APP_FIREBASE_STORAGE_BUCKET
        config.FIREBASE_MESSAGING_SENDER_ID = config.APP_FIREBASE_MESSAGING_SENDER_ID
        config.FIREBASE_APP_ID = config.APP_FIREBASE_APP_ID
        config.FIREBASE_MEASUREMENT_ID = config.APP_FIREBASE_MEASUREMENT_ID
      }

      // Log the actual Firebase config being used
      console.log('Using Firebase configuration:', {
        apiKey: config.APP_FIREBASE_API_KEY ? '****' : 'undefined',
        authDomain: config.APP_FIREBASE_AUTH_DOMAIN,
        projectId: config.APP_FIREBASE_PROJECT_ID,
        storageBucket: config.APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: config.APP_FIREBASE_MESSAGING_SENDER_ID ? '****' : 'undefined',
        appId: config.APP_FIREBASE_APP_ID ? '****' : 'undefined',
        measurementId: config.APP_FIREBASE_MEASUREMENT_ID
      })

      // Update both window.ENV and our exported env object
      Object.assign(window.ENV, config)
      Object.assign(envData, config)

      console.log(`Environment loaded: ${config.APP_ENVIRONMENT || envName}`)

      // Dispatch event to signal environment has been loaded
      window.dispatchEvent(new CustomEvent('env:loaded', { detail: config }))

    } catch (error) {
      console.error('Error loading configuration from API:', error)

      // For API failures, try with fallback URL
      try {
        const fallbackUrl = `/api/get-config?env=${envName}&fallback=true`
        console.log(`Attempting fallback API URL: ${fallbackUrl}`)

        const fallbackResponse = await fetch(fallbackUrl)

        if (fallbackResponse.ok) {
          const fallbackConfig = await fallbackResponse.json()

          // Update configs with fallback values
          Object.assign(window.ENV, fallbackConfig)
          Object.assign(envData, fallbackConfig)

          console.log(`Environment loaded from fallback: ${fallbackConfig.APP_ENVIRONMENT}`)

          // Dispatch event with fallback config
          window.dispatchEvent(new CustomEvent('env:loaded', { detail: fallbackConfig }))
          return // Exit early if fallback succeeded
        }
      } catch (fallbackError) {
        console.error('Fallback API request also failed:', fallbackError)
      }

      // If we're in staging environment, use hardcoded staging values
      if (envName === 'staging' || hostname.includes('staketrack-dev')) {
        const stagingConfig = {
          APP_ENVIRONMENT: 'STAGING',
          APP_FIREBASE_API_KEY: '',
          APP_FIREBASE_AUTH_DOMAIN: 'staketrack-dev.firebaseapp.com',
          APP_FIREBASE_PROJECT_ID: 'staketrack-dev',
          APP_FIREBASE_STORAGE_BUCKET: 'staketrack-dev.appspot.com',
          APP_FIREBASE_MESSAGING_SENDER_ID: '',
          APP_FIREBASE_APP_ID: '',
          APP_FIREBASE_MEASUREMENT_ID: 'G-HTLDLC7RM2',
          APP_USE_EMULATORS: 'false',
          CONFIG_INCOMPLETE: true
        }

        Object.assign(window.ENV, stagingConfig)
        Object.assign(envData, stagingConfig)

        console.log('Using fallback staging configuration with incomplete credentials')
        window.dispatchEvent(new CustomEvent('env:loaded', { detail: stagingConfig }))
        return
      }

      // For all environments, create minimal configuration without sensitive data
      const defaultEmptyConfig = {
        APP_ENVIRONMENT: hostname.includes('localhost') ? 'DEV' :
          (hostname.includes('staketrack-dev') ? 'STAGING' : 'PRD'),
        APP_USE_EMULATORS: hostname.includes('localhost') ? 'true' : 'false',
        CONFIG_INCOMPLETE: true
      }

      // Update both window.ENV and our exported env object
      Object.assign(window.ENV, defaultEmptyConfig)
      Object.assign(envData, defaultEmptyConfig)

      // Flag to indicate that configuration is incomplete
      window.ENV.CONFIG_INCOMPLETE = true

      console.warn('Using incomplete configuration. Firebase services will be unavailable.')

      // Dispatch both events: error and loaded with incomplete config
      window.dispatchEvent(new CustomEvent('env:error', { detail: error }))
      window.dispatchEvent(new CustomEvent('env:loaded', { detail: defaultEmptyConfig }))
    }
  } catch (error) {
    console.error('Fatal error in environment loading process:', error)

    // Create minimal default configuration without sensitive data
    const defaultEmptyConfig = {
      APP_ENVIRONMENT: 'UNKNOWN',
      APP_USE_EMULATORS: 'false',
      CONFIG_INCOMPLETE: true
    }

    // Update both window.ENV and our exported env object
    Object.assign(window.ENV, defaultEmptyConfig)
    Object.assign(envData, defaultEmptyConfig)

    // Dispatch error event
    window.dispatchEvent(new CustomEvent('env:error', { detail: error }))

    // Then dispatch loaded event with default empty config to ensure application continues
    window.dispatchEvent(new CustomEvent('env:loaded', { detail: defaultEmptyConfig }))
  }
}

// Execute the configuration loading immediately
fetchFirebaseConfig()
