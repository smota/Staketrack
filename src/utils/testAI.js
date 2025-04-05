/**
 * AI Testing Utility
 * Use this to test the AI functionality from the browser console
 *
 * Example:
 *   import { testAIFunctions } from '@/utils/testAI'
 *   testAIFunctions()
 */
import { aiService } from '@/services'

/**
 * Test AI functions and log results
 * @param {Object} options - Test options
 * @return {Promise<Object>} Test results
 */
export const testAIFunctions = async (options = {}) => {
  console.log('Testing AI Functions...')

  try {
    // First test the basic connectivity
    console.log('1. Testing Firebase Functions connectivity:')
    const connectionResult = await aiService.testFunctionsConnection()
    console.log('Connection test result:', connectionResult)

    // If no map ID provided, we'll stop after the connection test
    if (!options.mapId) {
      console.log('No mapId provided, skipping AI recommendations test')
      return {
        connection: connectionResult,
        recommendations: null
      }
    }

    // Test the recommendations function with a real map
    console.log(`2. Testing recommendations for map ID: ${options.mapId}`)
    const recResult = await aiService.getStakeholderRecommendations(options.mapId)
    console.log('Recommendations result:', recResult)

    return {
      connection: connectionResult,
      recommendations: recResult
    }
  } catch (error) {
    console.error('Error testing AI functions:', error)
    return {
      error: error.message
    }
  }
}

// Export a helper function that can be used in Vue component methods
export const runAITest = async (mapId) => {
  try {
    return await testAIFunctions({ mapId })
  } catch (error) {
    console.error('AI test failed:', error)
    return { error: error.message }
  }
}
