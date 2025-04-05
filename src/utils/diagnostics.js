/**
 * Firebase Functions Diagnostics Utility
 * Use this to diagnose Firebase Functions issues from browser console
 *
 * Usage:
 * import { testFirebaseFunctions } from '@/utils/diagnostics'
 * testFirebaseFunctions()
 */
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions'
import { aiService } from '@/services'
import { firebaseApp } from '@/firebase'
import config from '@/config'

/**
 * Comprehensive test for Firebase Functions with detailed diagnostics
 * @returns {Promise<Object>} Detailed diagnostics results
 */
export const testFirebaseFunctions = async () => {
  console.log('============================================')
  console.log('FIREBASE FUNCTIONS DIAGNOSTICS')
  console.log('============================================')

  // Get basic environment info
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    firebaseSDK: '10.1.0', // From package.json
    useEmulators: config.env.useEmulators || false,
    tests: {}
  }

  // Test 1: Direct initialization test
  console.log('\nTEST 1: Direct Functions initialization')
  try {
    const region = config.env.firebase.functionsRegion || 'europe-west1'
    console.log(`Initializing functions with region: ${region}`)

    const functions = getFunctions(firebaseApp, region)

    const isInitialized = !!functions
    console.log('Functions initialization:', isInitialized ? 'SUCCESS' : 'FAILED')

    if (isInitialized) {
      console.log('Functions properties:', Object.keys(functions))

      // If we're using emulators, try connecting
      if (config.env.useEmulators) {
        try {
          console.log('Connecting to emulator...')
          connectFunctionsEmulator(functions, 'localhost', 5001)
          console.log('Emulator connection: SUCCESS')

          // Try creating a function reference
          try {
            const helloWorld = httpsCallable(functions, 'helloWorld')
            console.log('Function reference creation: SUCCESS')

            // Try calling the function
            try {
              console.log('Calling helloWorld function...')
              const result = await helloWorld()
              console.log('Function call: SUCCESS')
              console.log('Result:', result.data)
            } catch (callError) {
              console.error('Function call: FAILED')
              console.error('Error:', callError)
            }
          } catch (refError) {
            console.error('Function reference creation: FAILED')
            console.error('Error:', refError)
          }
        } catch (emulatorError) {
          console.error('Emulator connection: FAILED')
          console.error('Error:', emulatorError)
        }
      }
    }

    results.tests.directInitialization = {
      success: isInitialized,
      functionKeys: isInitialized ? Object.keys(functions) : null
    }
  } catch (error) {
    console.error('Direct initialization error:', error)
    results.tests.directInitialization = {
      success: false,
      error: error.message
    }
  }

  // Test 2: Service layer test
  console.log('\nTEST 2: Service layer test')
  try {
    const serviceTest = await aiService.testFunctionsConnection()
    console.log('Service layer test result:', serviceTest)
    results.tests.serviceLayer = serviceTest
  } catch (error) {
    console.error('Service layer test error:', error)
    results.tests.serviceLayer = {
      success: false,
      error: error.message
    }
  }

  // Test 3: Configuration check
  console.log('\nTEST 3: Configuration check')
  const firebaseConfig = config.env.firebaseConfig
  console.log('Firebase config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAppId: !!firebaseConfig.appId,
    useEmulators: config.env.useEmulators,
    functionsRegion: config.env.firebase.functionsRegion
  })

  results.tests.configuration = {
    hasRequiredFields: !!(
      firebaseConfig.projectId &&
      firebaseConfig.authDomain &&
      firebaseConfig.apiKey &&
      firebaseConfig.appId
    ),
    projectId: firebaseConfig.projectId,
    emulatorConfig: config.env.useEmulators
  }

  console.log('\nDIAGNOSTICS COMPLETE')
  console.log('For Firebase Functions v10+, ensure:')
  console.log('1. All required Firebase modules are properly imported')
  console.log('2. The Firebase project ID matches the emulator project ID')
  console.log('3. Functions are deployed to the emulator')
  console.log('4. The correct region is specified (europe-west1)')
  console.log('============================================')

  return results
}

/**
 * Fallback test for AI features
 * Uses the fallback mechanisms instead of actual AI service
 * @param {string} mapId - Map ID to use for testing
 * @returns {Promise<Object>} Test results with recommendations
 */
export const testAIFallback = async (mapId) => {
  // Import services directly to avoid circular dependencies
  const { stakeholderService } = await import('@/services')

  console.log('Testing AI fallback mechanisms...')

  try {
    // Load the map
    if (!mapId) {
      console.error('Map ID is required for testing')
      return { success: false, error: 'Map ID is required' }
    }

    const map = await stakeholderService.getMap(mapId)
    if (!map) {
      console.error('Map not found:', mapId)
      return { success: false, error: 'Map not found' }
    }

    console.log('Map loaded:', map.name)

    // Generate fallback recommendations
    const recommendations = aiService._getFallbackRecommendations(map)
    console.log('Fallback recommendations generated successfully')

    return {
      success: true,
      map: {
        id: map.id,
        name: map.name,
        stakeholderCount: map.stakeholders.length
      },
      recommendations
    }
  } catch (error) {
    console.error('Error testing AI fallback:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Test functions directly via HTTP to the emulator
 * This bypasses the Firebase SDK entirely
 */
export const testEmulatorDirectly = async () => {
  console.log('Testing functions via direct HTTP requests to emulator...')

  const testFunctions = [
    'testEmulator',
    'generateStakeholderRecommendations',
    'generateStakeholderAdvice',
    'generateInfluenceAnalysis',
    'helloWorld',
    'getConfig'
  ]

  const results = {}

  for (const funcName of testFunctions) {
    try {
      console.log(`Testing function: ${funcName}`)
      const url = `http://localhost:5001/staketrack-dev/europe-west1/${funcName}`

      // For HTTP callable functions, we need to use a POST request with the right format
      const isCallable = funcName !== 'helloWorld' && funcName !== 'getConfig'

      if (isCallable) {
        // Callable function format
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: { test: true }
          })
        })

        const data = await response.text()
        results[funcName] = {
          success: response.ok,
          status: response.status,
          data
        }
      } else {
        // HTTP function
        const response = await fetch(url)
        const data = await response.text()
        results[funcName] = {
          success: response.ok,
          status: response.status,
          data
        }
      }

      console.log(`Function ${funcName} test result:`, results[funcName])
    } catch (error) {
      console.error(`Error testing ${funcName}:`, error)
      results[funcName] = {
        success: false,
        error: error.message
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    results
  }
}
