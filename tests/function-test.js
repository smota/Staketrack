/**
 * Firebase Functions emulator test script
 * Run this with: node tests/function-test.js
 */
const admin = require('firebase-admin')
const axios = require('axios')

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'staketrack-dev'
})

// Emulator settings
const EMULATOR_HOST = 'localhost:5001'
const REGION = 'europe-west1'
const PROJECT_ID = 'staketrack-dev'

// Construct base URL for Firebase Functions emulator
const BASE_URL = `http://${EMULATOR_HOST}/${PROJECT_ID}/${REGION}`

async function testFunction(functionName, data = null) {
  try {
    const url = `${BASE_URL}/${functionName}`
    console.log(`Calling ${functionName} at: ${url}`)

    let response
    if (data) {
      response = await axios.post(url, data)
    } else {
      response = await axios.get(url)
    }

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.response ? error.response.data : error.message
    }
  }
}

async function testFunctions() {
  console.log('Testing Firebase Functions in emulator mode...')

  // Test the helloWorld function
  console.log('\nTesting helloWorld function:')
  const helloResult = await testFunction('helloWorld')
  if (helloResult.success) {
    console.log('✅ Success:', helloResult.data)
  } else {
    console.error('❌ Error:', helloResult.error)
  }

  // Test generateStakeholderRecommendations function
  console.log('\nTesting generateStakeholderRecommendations function:')

  // Create minimal test data
  const testMapData = {
    mapData: {
      id: 'test-map',
      name: 'Test Map',
      description: 'Test map for emulator testing',
      stakeholders: [
        {
          name: 'Test Stakeholder',
          influence: 8,
          impact: 7,
          quadrant: 'manage-closely'
        }
      ]
    }
  }

  const recommendationsResult = await testFunction('generateStakeholderRecommendations', testMapData)
  if (recommendationsResult.success) {
    console.log('✅ Success:')
    console.log('- Result type:', typeof recommendationsResult.data)

    // Log only the first part of the response if it's large
    const content = recommendationsResult.data.content || recommendationsResult.data.text
    if (content && typeof content === 'string') {
      console.log('- Content preview:', content.substring(0, 100) + '...')
    } else {
      console.log('- Content:', content)
    }
  } else {
    console.error('❌ Error:', recommendationsResult.error)
  }

  // Test generateStakeholderAdvice function
  console.log('\nTesting generateStakeholderAdvice function:')

  // Create minimal test data
  const testStakeholderData = {
    stakeholderData: {
      id: 'test-stakeholder',
      name: 'Test Stakeholder',
      influence: 8,
      impact: 7,
      relationship: 6,
      quadrant: 'manage-closely',
      interests: 'Project success, minimal disruption',
      risk: 'May withdraw support if concerns not addressed'
    }
  }

  const adviceResult = await testFunction('generateStakeholderAdvice', testStakeholderData)
  if (adviceResult.success) {
    console.log('✅ Success:')
    console.log('- Result type:', typeof adviceResult.data)

    // Log only the first part of the response if it's large
    const text = adviceResult.data.text
    if (text) {
      console.log('- Text preview:', text.substring(0, 100) + '...')
    }
  } else {
    console.error('❌ Error:', adviceResult.error)
  }

  console.log('\nTest completed.')
}

// Run the tests
testFunctions().catch(error => {
  console.error('Unhandled error during test:', error)
})
