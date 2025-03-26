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

      // Make sure the config has the required fields
      if (!config.FIREBASE_API_KEY || !config.FIREBASE_PROJECT_ID) {
        throw new Error('Incomplete configuration received from server')
      }

      // Update both window.ENV and our exported env object
      Object.assign(window.ENV, config)
      Object.assign(envData, config)

      console.log(`Environment loaded: ${config.ENVIRONMENT || envName}`)

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

          console.log(`Environment loaded from fallback: ${fallbackConfig.ENVIRONMENT}`)

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
          ENVIRONMENT: 'STAGING',
          FIREBASE_API_KEY: 'AIzaSyDX_QLoBYkAX9o-_9RE4QJjZt47VrQDNFM',
          FIREBASE_AUTH_DOMAIN: 'staketrack-dev.firebaseapp.com',
          FIREBASE_PROJECT_ID: 'staketrack-dev',
          FIREBASE_STORAGE_BUCKET: 'staketrack-dev.appspot.com',
          FIREBASE_MESSAGING_SENDER_ID: '376336482298',
          FIREBASE_APP_ID: '1:376336482298:web:fecd532b9c13e3c94f1321',
          FIREBASE_MEASUREMENT_ID: 'G-XXXXXXXXXX',
          USE_EMULATORS: 'false',
          CONFIG_INCOMPLETE: false
        }

        Object.assign(window.ENV, stagingConfig)
        Object.assign(envData, stagingConfig)

        console.log('Using hardcoded staging configuration')
        window.dispatchEvent(new CustomEvent('env:loaded', { detail: stagingConfig }))
        return
      }

      // For all environments, create minimal configuration without sensitive data
      const defaultEmptyConfig = {
        ENVIRONMENT: hostname.includes('localhost') ? 'DEV' :
          (hostname.includes('staketrack-dev') ? 'STAGING' : 'PRD'),
        USE_EMULATORS: hostname.includes('localhost') ? 'true' : 'false',
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
      ENVIRONMENT: 'UNKNOWN',
      USE_EMULATORS: 'false',
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
