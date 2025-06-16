/**
 * Configuration Validator
 * Validates application configuration and determines available capabilities
 * Can be disabled via configuration when no longer needed
 */
import config from '@/config'

/**
 * Checks if minimal required configuration is available
 * @returns {Object} Validation results with status and any issues
 */
export function validateAppConfig() {
  // Skip validation if disabled via configuration
  if (config.features.enableConfigValidation === false) {
    return {
      isValid: true,
      issues: [],
      capabilities: {
        offlineMode: true,
        authentication: true,
        dataStorage: true,
        fileStorage: true,
        analytics: true
      },
      skipped: true
    }
  }

  // If using local storage, this is "anonymous" or "offline" mode
  if (config.features.useLocalStorage) {
    const issues = []
    const capabilities = {
      offlineMode: true,
      authentication: false,
      dataStorage: false,
      fileStorage: false,
      analytics: !!config.env.firebaseConfig.measurementId
    }

    if (config.features.enableAnalytics && !config.env.firebaseConfig.measurementId) {
      issues.push('Missing Firebase Measurement ID for Analytics in local storage mode')
    }

    return {
      isValid: issues.length === 0,
      issues,
      capabilities
    }
  }

  const issues = []
  const requiredConfigItems = [
    { path: 'env.firebaseConfig.projectId', name: 'Firebase Project ID' },
    { path: 'env.firebaseConfig.authDomain', name: 'Firebase Auth Domain' },
    { path: 'env.firebaseConfig.apiKey', name: 'Firebase API Key' }
  ]

  // Check each required configuration
  requiredConfigItems.forEach(item => {
    const value = getNestedProperty(config, item.path)
    if (!value) {
      issues.push(`Missing ${item.name}`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues,
    capabilities: {
      offlineMode: true, // Always available
      authentication: hasValidAuth(),
      dataStorage: hasValidFirestore(),
      fileStorage: hasValidStorage(),
      analytics: !!config.env.firebaseConfig.measurementId
    }
  }
}

/**
 * Safely get nested property from object
 * @param {Object} obj - Object to get property from
 * @param {string} path - Dot-notation path to property
 * @returns {*} Property value or empty string if not found
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((prev, curr) =>
    prev && prev[curr] ? prev[curr] : '', obj)
}

/**
 * Check if authentication config is valid
 * @returns {boolean} Whether auth configuration is valid
 */
function hasValidAuth() {
  return !!(config.env.firebaseConfig.apiKey &&
    config.env.firebaseConfig.authDomain)
}

/**
 * Check if Firestore config is valid
 * @returns {boolean} Whether Firestore configuration is valid
 */
function hasValidFirestore() {
  return !!(config.env.firebaseConfig.projectId)
}

/**
 * Check if Storage config is valid
 * @returns {boolean} Whether Storage configuration is valid
 */
function hasValidStorage() {
  return !!(config.env.firebaseConfig.storageBucket)
}

export default { validateAppConfig }
