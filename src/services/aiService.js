/* eslint-disable indent */
/**
 * AI Service
 * Handles interactions with Firebase's GenAI service for stakeholder recommendations
 */
import { stakeholderService } from '@/services'
import { getAuth } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { firebaseApp, getFunctionsInstance } from '@/firebase'
import config from '@/config'

class AIService {
  /**
   * Default API options
   */
  defaultOptions = {
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 1500
  }

  /**
   * Get AI-powered stakeholder engagement recommendations
   * @param {string|Object} mapIdOrMap - The stakeholder map ID or map object
   * @param {Object} options - Options for the request
   * @returns {Promise<Object>} Recommendations data
   */
  async getStakeholderRecommendations(mapIdOrMap, options = {}) {
    // Get the map data if only the ID was provided
    let map
    try {
      // Check if user is authenticated
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        return this._getAuthRequiredResponse()
      }

      // Verify Firebase Functions service is available first
      const functionsAvailable = await this.checkFunctionsAvailability()
      if (!functionsAvailable) {
        throw new Error('Firebase Functions service is not available')
      }

      if (typeof mapIdOrMap === 'string') {
        // Fetch the map using the stakeholder service
        map = await stakeholderService.getMap(mapIdOrMap)
      } else {
        // Use the provided map object
        map = mapIdOrMap
      }

      if (!map) {
        throw new Error('Map not found')
      }

      // Extract only the data needed for the recommendation prompt
      const mapData = this._prepareMapDataForAI(map)

      // Prepare options for server-side prompt generation
      const requestOptions = {
        specialFocus: options.specificFocus,
        modelOverrides: options.modelOverrides
      }

      // Get Firebase Functions instance
      const functions = getFunctionsInstance()

      // Log function instance details for debugging
      console.log('Functions instance region:', functions._region || 'Not specified')
      if (functions._emulatorOrigin) {
        console.log('Using emulator with origin:', functions._emulatorOrigin)
      }

      // Call the Firebase Cloud Function, handling compatibility with Functions v2
      try {
        console.log(`Calling Firebase Function 'generateStakeholderRecommendations' with mapData for map: ${map.id}`)

        // Create the callable function reference
        const generateRecommendations = httpsCallable(functions, 'generateStakeholderRecommendations')

        // Make the request to Firebase Function
        const result = await generateRecommendations({
          mapData,
          ...requestOptions
        })

        console.log('Function call successful, processing result')

        // Check if user has reached usage limits
        if (result.data.limitReached) {
          return this._getLimitReachedResponse(result.data.usageInfo)
        }

        // Process and format the AI response
        return this._processAIResponse(result.data, map)
      } catch (callError) {
        console.error('Error calling Firebase Function:', callError)
        throw new Error('Failed to get recommendations from AI service: ' + callError.message)
      }
    } catch (error) {
      console.error('Error getting AI recommendations:', error)

      // Pass through the error
      return {
        error: true,
        message: error.message,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Get AI-powered advice for individual stakeholder engagement
   * @param {string|Object} stakeholderId - Stakeholder ID or object
   * @param {Object} options - Options for the request
   * @returns {Promise<Object>} Stakeholder advice data
   */
  async getStakeholderAdvice(stakeholderId, options = {}) {
    let stakeholder
    try {
      // Check if user is authenticated
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        return this._getAuthRequiredResponse()
      }

      // Get the stakeholder data
      if (typeof stakeholderId === 'string') {
        stakeholder = await stakeholderService.getStakeholder(stakeholderId)
      } else {
        stakeholder = stakeholderId
      }

      if (!stakeholder) {
        throw new Error('Stakeholder not found')
      }

      // Extract only the data needed for the advice prompt
      const stakeholderData = this._prepareStakeholderDataForAI(stakeholder)

      // Prepare options for server-side prompt generation
      const requestOptions = {
        specialFocus: options.specificFocus,
        modelOverrides: options.modelOverrides
      }

      // Get Firebase Functions instance
      const functions = getFunctionsInstance()

      // Log function instance details for debugging
      console.log('Functions instance region:', functions._region || 'Not specified')
      if (functions._emulatorOrigin) {
        console.log('Using emulator with origin:', functions._emulatorOrigin)
      }

      // Call the Firebase Cloud Function
      const generateAdvice = httpsCallable(functions, 'generateStakeholderAdvice')

      // Make the request to Firebase Function with stakeholder data instead of prompt
      let result
      try {
        console.log(`Calling Firebase Function 'generateStakeholderAdvice' for stakeholder: ${stakeholder.id}`)
        result = await generateAdvice({
          stakeholderData,
          ...requestOptions
        })
      } catch (callError) {
        console.error('Error calling Firebase Function:', callError)
        throw new Error('Failed to get advice from AI service: ' + callError.message)
      }

      // Check if user has reached usage limits
      if (result.data.limitReached) {
        return this._getLimitReachedResponse(result.data.usageInfo)
      }

      // Process and format the AI response
      return {
        success: true,
        advice: result.data.text,
        stakeholder: stakeholder.name,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: result.data.usage?.model
        }
      }
    } catch (error) {
      console.error('Error getting stakeholder advice:', error)

      return {
        error: true,
        message: error.message,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Get AI analysis of stakeholder influence network
   * @param {string|Object} mapIdOrMap - Map ID or object
   * @returns {Promise<Object>} Influence network analysis
   */
  async getInfluenceNetworkAnalysis(mapIdOrMap, options = {}) {
    let map
    try {
      // Check if user is authenticated
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        return this._getAuthRequiredResponse()
      }

      if (typeof mapIdOrMap === 'string') {
        // Fetch the map using the stakeholder service
        map = await stakeholderService.getMap(mapIdOrMap)
      } else {
        // Use the provided map object
        map = mapIdOrMap
      }

      if (!map) {
        throw new Error('Map not found')
      }

      // Extract only the data needed for the influence network prompt
      const mapData = this._prepareMapDataForAI(map)

      // Prepare options for server-side prompt generation
      const requestOptions = {
        specialFocus: options.specificFocus,
        modelOverrides: options.modelOverrides
      }

      // Get Firebase Functions instance
      const functions = getFunctionsInstance()

      // Log function instance details for debugging
      console.log('Functions instance region:', functions._region || 'Not specified')
      if (functions._emulatorOrigin) {
        console.log('Using emulator with origin:', functions._emulatorOrigin)
      }

      // Call the Firebase Cloud Function
      const generateAnalysis = httpsCallable(functions, 'generateInfluenceAnalysis')

      // Make the request to Firebase Function with map data instead of prompt
      let result
      try {
        result = await generateAnalysis({
          mapData,
          ...requestOptions
        })
      } catch (callError) {
        console.error('Error calling Firebase Function:', callError)
        throw new Error('Failed to get network analysis from AI service: ' + callError.message)
      }

      // Check if user has reached usage limits
      if (result.data.limitReached) {
        return this._getLimitReachedResponse(result.data.usageInfo)
      }

      return {
        success: true,
        analysis: result.data.text,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: result.data.usage?.model
        }
      }
    } catch (error) {
      console.error('Error getting influence network analysis:', error)

      return {
        error: true,
        message: error.message,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Get issue-specific engagement recommendations
   * @param {string|Object} mapIdOrMap - Map ID or object
   * @param {string} issue - The specific issue to analyze
   * @returns {Promise<Object>} Issue-specific recommendations
   */
  async getIssueSpecificRecommendations(mapIdOrMap, issue, options = {}) {
    let map
    try {
      // Check if user is authenticated
      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        return this._getAuthRequiredResponse()
      }

      if (!issue || typeof issue !== 'string') {
        throw new Error('A specific issue must be provided')
      }

      // Get the map data
      if (typeof mapIdOrMap === 'string') {
        map = await stakeholderService.getMap(mapIdOrMap)
      } else {
        map = mapIdOrMap
      }

      if (!map) {
        throw new Error('Map not found')
      }

      // Validate issue
      if (!issue || typeof issue !== 'string' || issue.trim() === '') {
        throw new Error('Valid issue description is required')
      }

      // Extract only the data needed for the issue-specific prompt
      const mapData = this._prepareMapDataForAI(map)

      // Prepare options for server-side prompt generation
      const requestOptions = {
        issue: issue.trim(),
        specialFocus: options.specificFocus,
        modelOverrides: options.modelOverrides
      }

      // Get Firebase Functions instance
      const functions = getFunctionsInstance()

      // Log function instance details for debugging
      console.log('Functions instance region:', functions._region || 'Not specified')
      if (functions._emulatorOrigin) {
        console.log('Using emulator with origin:', functions._emulatorOrigin)
      }

      // Call the Firebase Cloud Function
      const generateIssueRecommendations = httpsCallable(functions, 'generateIssueRecommendations')

      // Make the request to Firebase Function with map data and issue instead of prompt
      let result
      try {
        result = await generateIssueRecommendations({
          mapData,
          issue,
          ...requestOptions
        })
      } catch (callError) {
        console.error('Error calling Firebase Function:', callError)
        throw new Error('Failed to get issue recommendations from AI service: ' + callError.message)
      }

      // Check if user has reached usage limits
      if (result.data.limitReached) {
        return this._getLimitReachedResponse(result.data.usageInfo)
      }

      return {
        success: true,
        recommendations: result.data.text,
        issue: issue,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: result.data.usage?.model
        }
      }
    } catch (error) {
      console.error('Error getting issue-specific recommendations:', error)

      return {
        error: true,
        message: error.message,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Prepare map data for AI processing
   * Extracts only the relevant fields needed for the server-side prompt
   * @param {StakeholderMap} map - The stakeholder map
   * @returns {Object} Trimmed map data for AI processing
   * @private
   */
  _prepareMapDataForAI(map) {
    // Extract basic map information
    const { id, name, description, projectName, projectGoals, projectScope } = map

    // Extract and prepare stakeholder data
    const stakeholders = map.stakeholders.map(s => ({
      name: s.name,
      category: s.category,
      position: s.position,
      organization: s.organization,
      influence: s.influence,
      impact: s.impact,
      relationship: s.relationship,
      quadrant: s.quadrant,
      interests: s.interests,
      contribution: s.contribution,
      risk: s.risk,
      communication: s.communication,
      strategy: s.strategy,
      // Only include the 3 most recent interactions
      interactions: (s.interactions || [])
        .slice(0, 3)
        .map(i => ({
          date: i.date.toISOString().split('T')[0],
          type: i.type,
          notes: i.notes
        }))
    }))

    return {
      id,
      name,
      description,
      projectName,
      projectGoals,
      projectScope,
      stakeholders
    }
  }

  /**
   * Prepare stakeholder data for AI processing
   * @param {Stakeholder} stakeholder - The stakeholder
   * @returns {Object} Prepared stakeholder data
   * @private
   */
  _prepareStakeholderDataForAI(stakeholder) {
    // Extract only the data needed for the advice
    const {
      id, name, category, position, organization,
      influence, impact, relationship, quadrant,
      interests, contribution, risk, communication, strategy
    } = stakeholder

    // Format the interactions
    const interactions = (stakeholder.interactions || [])
      .slice(0, 5) // Only use the 5 most recent interactions
      .map(i => ({
        date: i.date.toISOString().split('T')[0],
        type: i.type,
        notes: i.notes
      }))

    return {
      id,
      name,
      category,
      position,
      organization,
      influence,
      impact,
      relationship,
      quadrant,
      interests,
      contribution,
      risk,
      communication,
      strategy,
      interactions
    }
  }

  /**
   * Generate response for unauthenticated users
   * @returns {Object} Authentication required response
   * @private
   */
  _getAuthRequiredResponse() {
    return {
      authRequired: true,
      message: 'This feature requires authentication. Please log in to access AI-powered recommendations.',
      metadata: {
        generatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Generate response when usage limit is reached
   * @param {Object} usageInfo - Usage information
   * @returns {Object} Limit reached response
   * @private
   */
  _getLimitReachedResponse(usageInfo) {
    const resetDate = new Date(usageInfo.resetDate)
    const formattedResetDate = resetDate.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return {
      limitReached: true,
      message: `You've reached your weekly limit of ${usageInfo.limit} AI-powered recommendations. Your limit will reset on ${formattedResetDate}.`,
      usageInfo,
      metadata: {
        generatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Process and format the AI response
   * @param {Object} response - Raw API response
   * @param {StakeholderMap} map - The stakeholder map
   * @returns {Object} Processed recommendations
   * @private
   */
  _processAIResponse(response, map) {
    try {
      // Get the AI-generated content
      const content = response.content || response.text || null

      if (!content) {
        throw new Error('No content found in AI response')
      }

      let parsedContent

      // If the response is already JSON, use it
      if (typeof content === 'object') {
        parsedContent = content
      } else {
        // Parse JSON string
        // First try to extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        const jsonString = jsonMatch ? jsonMatch[1] : content

        parsedContent = JSON.parse(jsonString)
      }

      // Add metadata
      return {
        ...parsedContent,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: response.model || response.usage?.model,
          mapId: map.id,
          mapName: map.name
        }
      }
    } catch (error) {
      console.error('Error processing AI response:', error)
      return this._getFallbackRecommendations(map)
    }
  }

  /**
   * Generate fallback recommendations when the AI service fails
   * @param {StakeholderMap} map - The stakeholder map
   * @returns {Object} Simple fallback recommendations
   * @private
   */
  _getFallbackRecommendations(map) {
    // Get high-influence stakeholders
    const highInfluence = map.stakeholders
      .filter(s => s.influence >= 7)
      .map(s => s.name)

    // Get stakeholders in the "manage closely" quadrant
    const manageClosely = map.stakeholders
      .filter(s => s.quadrant === 'manage-closely')
      .map(s => s.name)

    // Basic stakeholder-specific recommendations
    const stakeholderRecsByName = {}
    map.stakeholders.forEach(s => {
      stakeholderRecsByName[s.name] = {
        engagementApproach: this._getBasicEngagementApproach(s),
        communicationChannels: this._getBasicCommunicationChannels(s),
        keyMessages: ['Focus on project benefits', 'Address specific concerns'],
        riskMitigation: s.risk || 'Maintain regular communication'
      }
    })

    return {
      overallStrategy: {
        summary: 'Focus on regular communication with key stakeholders while maintaining transparency across all groups',
        keyPriorities: [
          'Establish regular communication cadence',
          'Develop clear messaging about project goals',
          'Identify and address stakeholder concerns early'
        ],
        criticalStakeholders: highInfluence.length > 0 ? highInfluence : ['No high-influence stakeholders identified'],
        recommendedActions: [
          'Schedule individual meetings with high-influence stakeholders',
          'Create a communication plan with regular updates',
          'Document and address stakeholder feedback'
        ]
      },
      stakeholderSpecificRecommendations: stakeholderRecsByName,
      communicationPriorities: [
        'Ensure all stakeholders understand project goals and timeline',
        'Provide regular status updates to maintain transparency',
        'Create tailored messages for different stakeholder groups'
      ],
      riskManagement: {
        topRisks: [
          {
            description: 'Lack of stakeholder buy-in for project approach',
            stakeholdersInvolved: manageClosely.length > 0 ? manageClosely : ['All stakeholders'],
            mitigationStrategy: 'Increase communication frequency and collect regular feedback'
          }
        ]
      },
      opportunityAreas: [
        {
          description: 'Improve stakeholder relationships through more regular engagement',
          stakeholdersInvolved: ['All stakeholders'],
          potentialApproach: 'Implement regular check-ins and feedback mechanisms'
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        mapId: map.id,
        mapName: map.name,
        note: 'These are fallback recommendations. For more personalized insights, please try again later.'
      }
    }
  }

  /**
   * Get basic engagement approach based on stakeholder quadrant
   * @param {Stakeholder} stakeholder - The stakeholder
   * @returns {string} Basic engagement approach
   * @private
   */
  _getBasicEngagementApproach(stakeholder) {
    switch (stakeholder.quadrant) {
      case 'manage-closely':
        return 'Regular personal meetings and proactive engagement'
      case 'keep-satisfied':
        return 'Regular updates and consultation on decisions'
      case 'keep-informed':
        return 'Regular communication and updates'
      case 'monitor':
        return 'Periodic updates and monitoring of needs'
      default:
        return 'Maintain appropriate level of communication'
    }
  }

  /**
   * Get basic communication channels based on stakeholder category
   * @param {Stakeholder} stakeholder - The stakeholder
   * @returns {string[]} Suggested communication channels
   * @private
   */
  _getBasicCommunicationChannels(stakeholder) {
    const category = stakeholder.category

    const channels = ['Email', 'Project updates']

    if (category === 'internal' || category === 'employee') {
      channels.push('Team meetings', 'Internal communication tools')
    }

    if (stakeholder.quadrant === 'manage-closely' || stakeholder.quadrant === 'keep-satisfied') {
      channels.push('One-on-one meetings', 'Phone calls')
    }

    if (category === 'external' || category === 'community') {
      channels.push('Public communications')
    }

    if (category === 'customer') {
      channels.push('Customer feedback sessions')
    }

    if (category === 'regulator') {
      channels.push('Formal written communications')
    }

    return channels
  }

  /**
   * Test the Firebase Functions connectivity and AI function availability
   * @returns {Promise<Object>} Test results with function status
   */
  async testFunctionsConnection() {
    try {
      console.log('Testing Firebase Functions connectivity...')

      // Get Firebase configuration for diagnostic info
      const firebaseConfig = config.env.firebaseConfig
      const useEmulators = config.env.useEmulators || false
      const functionsRegion = config.env.firebase.functionsRegion || 'europe-west1'

      console.log('Firebase SDK Version: 10.1.0')
      console.log('Environment:', process.env.NODE_ENV)
      console.log('Using emulators:', useEmulators)
      console.log('Functions region:', functionsRegion)
      console.log('Project ID:', firebaseConfig.projectId)

      try {
        // Get Functions instance
        const functions = getFunctionsInstance()

        if (!functions) {
          console.error('Functions instance is NULL - this indicates a problem with Firebase Functions initialization')
          return {
            success: false,
            message: 'Failed to get Firebase Functions instance - check browser console for details',
            timestamp: new Date().toISOString(),
            diagnostics: {
              isEmulator: useEmulators,
              environment: process.env.NODE_ENV,
              projectId: firebaseConfig.projectId,
              region: functionsRegion
            }
          }
        }

        // Log connectivity info
        const isUsingEmulator = !!functions._emulatorOrigin
        console.log('Functions instance details:')
        console.log('- Region:', functions._region || 'Not specified')
        console.log('- Using emulator:', isUsingEmulator)
        if (isUsingEmulator) {
          console.log('- Emulator origin:', functions._emulatorOrigin)
        }

        // Attempt to retrieve the 'type' property which should exist on a valid Functions instance
        if (typeof functions.type !== 'string') {
          console.warn('Functions instance is missing expected properties')
        }

        // Test results object
        const results = {
          success: true,
          message: 'Firebase Functions connectivity test complete',
          timestamp: new Date().toISOString(),
          isUsingEmulator,
          functionTests: {},
          diagnostics: {
            firebaseInitialized: true,
            functionsInstantiated: !!functions,
            environment: process.env.NODE_ENV,
            emulatorEnabled: useEmulators,
            emulatorConnected: isUsingEmulator,
            functionsProperties: Object.keys(functions).filter(k => !k.startsWith('_')).join(', '),
            region: functionsRegion
          }
        }

        // Test each AI function (references only, don't actually call except for helloWorld)
        const functionNames = [
          'helloWorld',
          'generateStakeholderRecommendations',
          'generateStakeholderAdvice',
          'generateInfluenceAnalysis'
        ]

        // Run tests one by one
        for (const funcName of functionNames) {
          try {
            console.log(`Testing function reference: ${funcName}...`)
            let func

            try {
              func = httpsCallable(functions, funcName)

              if (!func || typeof func !== 'function') {
                throw new Error('Function reference is not a function')
              }

              // For helloWorld, we can try to call it (if emulator is working)
              if (funcName === 'helloWorld' && isUsingEmulator) {
                try {
                  console.log('Attempting to call helloWorld test function...')
                  const result = await func()
                  console.log('Function call result:', result?.data)

                  results.functionTests[funcName] = {
                    success: true,
                    response: result?.data,
                    referenceValid: true,
                    callSucceeded: true,
                    message: 'Function reference and call successful'
                  }
                } catch (callError) {
                  console.warn(`Call to ${funcName} failed:`, callError)
                  results.functionTests[funcName] = {
                    success: true,
                    referenceValid: true,
                    callSucceeded: false,
                    callError: callError.message,
                    message: 'Function reference successful but call failed'
                  }
                }
              } else {
                // Just verify we can create a reference to the function
                results.functionTests[funcName] = {
                  success: true,
                  referenceValid: true,
                  message: 'Function reference successful (not called)'
                }
              }
            } catch (refError) {
              console.error(`Error creating reference to function ${funcName}:`, refError)
              results.functionTests[funcName] = {
                success: false,
                referenceValid: false,
                message: `Error creating function reference: ${refError.message}`,
                error: refError.message
              }
            }
          } catch (functionError) {
            results.functionTests[funcName] = {
              success: false,
              message: `Error with function ${funcName}: ${functionError.message}`,
              error: functionError.message
            }
          }
        }

        return results
      } catch (functionsError) {
        return {
          success: false,
          message: 'Error initializing Firebase Functions: ' + functionsError.message,
          error: functionsError.message,
          timestamp: new Date().toISOString(),
          diagnostics: {
            isEmulator: useEmulators,
            environment: process.env.NODE_ENV,
            firebaseError: functionsError.message,
            projectId: firebaseConfig.projectId
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error testing Functions connection: ' + error.message,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Check if Firebase Functions service is available
   * @returns {Promise<boolean>} True if available, false otherwise
   */
  async checkFunctionsAvailability() {
    try {
      console.log('Checking Firebase Functions availability...')

      // Get Functions instance
      const functions = getFunctionsInstance()

      // Log basic information
      console.log('Functions configuration:', {
        region: functions._region || 'not specified',
        usingEmulator: !!functions._emulatorOrigin,
        emulatorOrigin: functions._emulatorOrigin || 'none'
      })

      // Try to call a simple test function (helloWorld) if available
      // This is a more reliable test than just checking for the instance
      try {
        // Create the callable reference
        const helloWorld = httpsCallable(functions, 'helloWorld')

        // Set a timeout to prevent hanging
        const result = await Promise.race([
          helloWorld(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Functions call timed out after 5 seconds')), 5000)
          })
        ])

        console.log('Firebase Functions test successful:', result?.data)
        return true
      } catch (callError) {
        // Check for specific error types that indicate the service is available
        // but the function might not exist
        if (
          callError.message.includes('not found') ||
          callError.message.includes('FUNCTIONS_UNAVAILABLE')
        ) {
          console.warn('Functions service is available but test function not found:', callError.message)
          return true // Service exists but function not found
        }

        console.error('Firebase Functions test failed:', callError)
        return false
      }
    } catch (error) {
      console.error('Error checking Firebase Functions availability:', error)
      return false
    }
  }
}

// Export a singleton instance
export const aiService = new AIService()
