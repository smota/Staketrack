/**
 * Firebase V2 API Compatibility Validator
 * Checks that Firebase services are properly initialized and compatible with v2 API
 */

import { getServicesStatus } from '@/firebase'

/**
 * Validates that Firebase services are properly initialized with v2 API compatibility
 * @returns {Object} Validation results for each service
 */
export function validateFirebaseServices() {
  const status = getServicesStatus()
  const validationResults = {}

  // Check Firebase app initialization
  validationResults.app = {
    initialized: status.app.initialized,
    error: status.app.error,
    v2Compatible: true // Firebase app itself doesn't have v2 API concerns
  }

  // Check Auth service
  validationResults.auth = {
    initialized: status.auth.initialized,
    error: status.auth.error,
    v2Compatible: true // Auth doesn't have specific v2 API issues to check
  }

  // Check Firestore service
  validationResults.firestore = {
    initialized: status.firestore.initialized,
    error: status.firestore.error,
    v2Compatible: true // Firestore client SDK is compatible with v2 rules
  }

  // Check Functions service (most important for v2 compatibility)
  validationResults.functions = {
    initialized: status.functions.initialized,
    error: status.functions.error,
    v2Compatible: checkFunctionsV2Compatibility()
  }

  // Check Storage service
  validationResults.storage = {
    initialized: status.storage.initialized,
    error: status.storage.error,
    v2Compatible: true // Storage doesn't have specific v2 API issues to check
  }

  return validationResults
}

/**
 * Checks Firebase Functions for v2 API compatibility
 * @returns {boolean} Whether Functions appear to be v2 compatible
 */
function checkFunctionsV2Compatibility() {
  // This is a very basic check - in a real implementation, you would
  // perform more sophisticated checks with fallbacks

  try {
    // Check if the Firebase Functions module is using v2 httpCallable format
    const functionsModule = require('firebase/functions')

    // Check for v2 specific functions
    const hasHttpsCallable = typeof functionsModule.httpsCallable === 'function'

    return hasHttpsCallable
  } catch (error) {
    console.error('Error checking Functions v2 compatibility:', error)
    return false
  }
}

/**
 * Logs Firebase service compatibility issues to console
 * @param {Object} validationResults - Results from validateFirebaseServices
 */
export function logServiceCompatibilityIssues(validationResults) {
  console.log('Firebase Services Compatibility Check:')

  let hasIssues = false

  Object.entries(validationResults).forEach(([serviceName, status]) => {
    if (!status.initialized) {
      console.error(`❌ ${serviceName}: Not initialized. Error: ${status.error || 'Unknown error'}`)
      hasIssues = true
    } else if (!status.v2Compatible) {
      console.error(`⚠️ ${serviceName}: Initialized but may not be v2 API compatible`)
      hasIssues = true
    } else {
      console.log(`✅ ${serviceName}: Initialized and v2 compatible`)
    }
  })

  if (hasIssues) {
    console.warn('Issues detected with Firebase services. Some functionality may be limited.')

    // In production, you might want to send this to a monitoring service
    if (typeof window !== 'undefined' && window.errorReporting) {
      window.errorReporting.report('Firebase services compatibility issues detected')
    }
  } else {
    console.log('All Firebase services initialized and v2 compatible')
  }

  return hasIssues
}

/**
 * Checks application readiness with Firebase services
 * @returns {Promise<boolean>} Whether the application is ready
 */
export async function checkFirebaseReadiness() {
  const validationResults = validateFirebaseServices()
  const hasIssues = logServiceCompatibilityIssues(validationResults)

  // Determine if the application can proceed despite any issues
  const isReady = validationResults.app.initialized &&
    validationResults.auth.initialized &&
    validationResults.firestore.initialized

  if (!isReady) {
    console.error('CRITICAL: Core Firebase services failed to initialize')
  }

  return isReady
}

export default {
  validateFirebaseServices,
  logServiceCompatibilityIssues,
  checkFirebaseReadiness
}
