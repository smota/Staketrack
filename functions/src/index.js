/**
 * StakeTrack Cloud Functions
 * Firebase Cloud Functions for secure configuration and API endpoints
 */

const { https, logger } = require('firebase-functions')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })
const { VertexAI } = require('@google-cloud/vertexai')
const promptTemplates = require('./config/promptTemplates')

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp()
}

// Initialize Vertex AI
const projectId = process.env.GCLOUD_PROJECT
const location = 'us-central1'
const vertexAI = new VertexAI({ project: projectId, location })

/**
 * Default model configurations
 * These are now handled by the prompt templates
 */
const ModelConfig = promptTemplates.modelConfigs
const SafetySettings = promptTemplates.safetySettings

/**
 * Get environment-specific configuration
 * Provides Firebase configuration without exposing sensitive keys in client code
 */
exports.getConfig = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    // Get environment from query params
    const env = request.query.env || 'local'
    const isFallback = request.query.fallback === 'true'

    let config

    // For production, use runtime config from environment variables
    // No hard-coded secrets
    if (env === 'production') {
      // Production environment config
      config = {
        APP_ENVIRONMENT: 'PRD',
        APP_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        APP_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        APP_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        APP_FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        APP_FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        APP_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        APP_FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
        APP_USE_EMULATORS: 'false',
        CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY
      }
    } else if (env === 'development') {
      // Development environment config
      config = {
        APP_ENVIRONMENT: 'DEV',
        APP_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        APP_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        APP_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        APP_FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        APP_FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        APP_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        APP_FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
        APP_USE_EMULATORS: 'false',
        CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY
      }
    } else {
      // Local development config
      config = {
        APP_ENVIRONMENT: 'LOCAL',
        APP_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        APP_FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        APP_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        APP_FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        APP_FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        APP_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        APP_FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
        APP_USE_EMULATORS: 'true',
        CONFIG_INCOMPLETE: !process.env.FIREBASE_API_KEY
      }
    }

    // If config is incomplete and this is not a fallback request, provide minimal info
    if (config.CONFIG_INCOMPLETE && !isFallback) {
      functions.logger.warn(`Incomplete configuration requested for ${env} environment`)

      response.status(500).json({
        error: 'Configuration incomplete',
        message: 'The requested configuration is incomplete. Please check Firebase Function environment variables.',
        APP_ENVIRONMENT: config.APP_ENVIRONMENT,
        CONFIG_INCOMPLETE: true
      })
      return
    }

    // Add timestamp for debugging
    config.TIMESTAMP = new Date().toISOString()

    // Return config
    response.json(config)
  })
})

/**
 * Generate AI content with Vertex AI
 * @param {string} prompt - The formatted prompt
 * @param {Object} modelConfig - Configuration for the model
 * @returns {Promise<Object>} Response from Vertex AI
 */
async function generateAIContent(prompt, modelConfig = ModelConfig.default) {
  // Initialize the generative model with the specified configuration
  const generativeModel = vertexAI.preview.getGenerativeModel({
    model: modelConfig.model || 'gemini-1.5-pro',
    generation_config: {
      temperature: modelConfig.temperature !== undefined ? modelConfig.temperature : 0.7,
      maxOutputTokens: modelConfig.maxTokens || modelConfig.maxOutputTokens || 1500,
      topK: modelConfig.topK || 40,
      topP: modelConfig.topP || 0.8
    },
    safety_settings: SafetySettings
  })

  // Generate response
  const result = await generativeModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  })

  return result.response
}

/**
 * Firebase Cloud Function to generate stakeholder recommendations
 * Uses Vertex AI with Gemini model to generate recommendations
 */
exports.generateStakeholderRecommendations = https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      return {
        success: false,
        message: 'Authentication required to access AI recommendations.',
        authRequired: true
      }
    }

    const userId = context.auth.uid

    // Check if user has reached their weekly limit
    const usageLimits = await checkUserUsageLimits(userId)
    if (usageLimits.hasReachedLimit) {
      const resetDate = new Date(usageLimits.resetDate)
      return {
        success: false,
        message: `You've reached your weekly limit of ${usageLimits.limit} AI recommendations. Your limit will reset on ${resetDate.toLocaleDateString()}.`,
        limitReached: true,
        usageInfo: {
          currentUsage: usageLimits.currentUsage,
          limit: usageLimits.limit,
          resetDate: usageLimits.resetDate
        }
      }
    }

    // Extract parameters - now we expect mapData instead of a full prompt
    const { mapData, modelOverrides, specialFocus } = data

    if (!mapData) {
      return {
        success: false,
        message: 'Map data is required to generate recommendations.'
      }
    }

    // Build prompt using server-side template
    const prompt = promptTemplates.buildPrompt('stakeholderRecommendationsJSON', mapData, {
      specialFocus,
      modelOverrides
    })

    // Get model configuration from the template
    const modelConfig = promptTemplates.getModelConfig('stakeholderRecommendationsJSON', {
      modelOverrides
    })

    // Generate response using the centralized generation function
    const response = await generateAIContent(prompt, modelConfig)

    const usage = {
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    }

    // Record usage in Firestore
    await recordAIUsage(
      userId,
      'stakeholder-recommendations',
      modelConfig.model,
      usage.promptTokens,
      usage.outputTokens
    )

    logger.info(`Generated stakeholder recommendations for user ${userId}`)

    return {
      success: true,
      text: response.text(),
      usage: usage,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Error generating stakeholder recommendations:', error)
    return {
      success: false,
      message: 'An error occurred while generating recommendations. Please try again later.'
    }
  }
})

/**
 * Firebase Cloud Function to generate stakeholder advice
 * For specific advice on engaging with individual stakeholders
 */
exports.generateStakeholderAdvice = https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      return {
        success: false,
        message: 'Authentication required to access AI recommendations.',
        authRequired: true
      }
    }

    const userId = context.auth.uid

    // Check if user has reached their weekly limit
    const usageLimits = await checkUserUsageLimits(userId)
    if (usageLimits.hasReachedLimit) {
      const resetDate = new Date(usageLimits.resetDate)
      return {
        success: false,
        message: `You've reached your weekly limit of ${usageLimits.limit} AI recommendations. Your limit will reset on ${resetDate.toLocaleDateString()}.`,
        limitReached: true,
        usageInfo: {
          currentUsage: usageLimits.currentUsage,
          limit: usageLimits.limit,
          resetDate: usageLimits.resetDate
        }
      }
    }

    // Extract parameters - now we expect stakeholderData instead of a full prompt
    const { stakeholderData, modelOverrides, specialFocus } = data

    if (!stakeholderData) {
      return {
        success: false,
        message: 'Stakeholder data is required to generate advice.'
      }
    }

    // Build prompt using server-side template
    const prompt = promptTemplates.buildPrompt('stakeholderAdvice', stakeholderData, {
      specialFocus,
      modelOverrides
    })

    // Get model configuration from the template
    const modelConfig = promptTemplates.getModelConfig('stakeholderAdvice', {
      modelOverrides
    })

    // Generate response using the centralized generation function
    const response = await generateAIContent(prompt, modelConfig)

    const usage = {
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    }

    // Record usage in Firestore
    await recordAIUsage(
      userId,
      'stakeholder-advice',
      modelConfig.model,
      usage.promptTokens,
      usage.outputTokens
    )

    logger.info(`Generated stakeholder advice for user ${userId}`)

    return {
      success: true,
      text: response.text(),
      usage: usage,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Error generating stakeholder advice:', error)
    return {
      success: false,
      message: 'An error occurred while generating stakeholder advice. Please try again later.'
    }
  }
})

/**
 * Firebase Cloud Function to generate influence network analysis
 */
exports.generateInfluenceAnalysis = https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      return {
        success: false,
        message: 'Authentication required to access AI recommendations.',
        authRequired: true
      }
    }

    const userId = context.auth.uid

    // Check if user has reached their weekly limit
    const usageLimits = await checkUserUsageLimits(userId)
    if (usageLimits.hasReachedLimit) {
      const resetDate = new Date(usageLimits.resetDate)
      return {
        success: false,
        message: `You've reached your weekly limit of ${usageLimits.limit} AI recommendations. Your limit will reset on ${resetDate.toLocaleDateString()}.`,
        limitReached: true,
        usageInfo: {
          currentUsage: usageLimits.currentUsage,
          limit: usageLimits.limit,
          resetDate: usageLimits.resetDate
        }
      }
    }

    // Extract parameters - now we expect mapData instead of a full prompt
    const { mapData, modelOverrides, specialFocus } = data

    if (!mapData) {
      return {
        success: false,
        message: 'Map data is required to generate influence analysis.'
      }
    }

    // Build prompt using server-side template
    const prompt = promptTemplates.buildPrompt('influenceNetwork', mapData, {
      specialFocus,
      modelOverrides
    })

    // Get model configuration from the template
    const modelConfig = promptTemplates.getModelConfig('influenceNetwork', {
      modelOverrides
    })

    // Generate response using the centralized generation function
    const response = await generateAIContent(prompt, modelConfig)

    const usage = {
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    }

    // Record usage in Firestore
    await recordAIUsage(
      userId,
      'influence-analysis',
      modelConfig.model,
      usage.promptTokens,
      usage.outputTokens
    )

    logger.info(`Generated influence analysis for user ${userId}`)

    return {
      success: true,
      text: response.text(),
      usage: usage,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Error generating influence analysis:', error)
    return {
      success: false,
      message: 'An error occurred while generating influence analysis. Please try again later.'
    }
  }
})

/**
 * Firebase Cloud Function to generate issue-specific recommendations
 */
exports.generateIssueRecommendations = https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      return {
        success: false,
        message: 'Authentication required to access AI recommendations.',
        authRequired: true
      }
    }

    const userId = context.auth.uid

    // Check if user has reached their weekly limit
    const usageLimits = await checkUserUsageLimits(userId)
    if (usageLimits.hasReachedLimit) {
      const resetDate = new Date(usageLimits.resetDate)
      return {
        success: false,
        message: `You've reached your weekly limit of ${usageLimits.limit} AI recommendations. Your limit will reset on ${resetDate.toLocaleDateString()}.`,
        limitReached: true,
        usageInfo: {
          currentUsage: usageLimits.currentUsage,
          limit: usageLimits.limit,
          resetDate: usageLimits.resetDate
        }
      }
    }

    // Extract parameters - now we expect mapData and issue instead of a full prompt
    const { mapData, issue, modelOverrides, specialFocus } = data

    if (!mapData) {
      return {
        success: false,
        message: 'Map data is required to generate issue-specific recommendations.'
      }
    }

    if (!issue) {
      return {
        success: false,
        message: 'Issue description is required for issue-specific recommendations.'
      }
    }

    // Build prompt using server-side template
    const prompt = promptTemplates.buildPrompt('issueSpecific', { ...mapData, issue }, {
      specialFocus,
      modelOverrides
    })

    // Get model configuration from the template
    const modelConfig = promptTemplates.getModelConfig('issueSpecific', {
      modelOverrides
    })

    // Generate response using the centralized generation function
    const response = await generateAIContent(prompt, modelConfig)

    const usage = {
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    }

    // Record usage in Firestore
    await recordAIUsage(
      userId,
      'issue-recommendations',
      modelConfig.model,
      usage.promptTokens,
      usage.outputTokens
    )

    logger.info(`Generated issue recommendations for user ${userId}`)

    return {
      success: true,
      text: response.text(),
      usage: usage,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Error generating issue recommendations:', error)
    return {
      success: false,
      message: 'An error occurred while generating issue recommendations. Please try again later.'
    }
  }
})

/**
 * Record AI usage for a user
 * @param {string} userId - User ID
 * @param {string} type - Type of AI request
 * @param {string} model - AI model used
 * @param {number} promptTokens - Approximate number of prompt tokens
 * @param {number} outputTokens - Approximate number of output tokens
 * @returns {Promise<void>}
 */
async function recordAIUsage(userId, type, model, promptTokens, outputTokens) {
  try {
    // Record individual usage
    await admin.firestore().collection('aiUsage').add({
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type,
      model,
      promptTokens,
      outputTokens
    })

    // Update weekly usage counter
    const now = new Date()
    const weekStart = getWeekStartDate(now)
    const weekEnd = getWeekEndDate(now)
    const weekId = weekStart.toISOString().split('T')[0]
    const weeklyUsageRef = admin.firestore().collection('aiWeeklyUsage').doc(`${userId}_${weekId}`)

    // Use transaction to safely update the counter
    await admin.firestore().runTransaction(async (transaction) => {
      const weeklyUsageDoc = await transaction.get(weeklyUsageRef)

      if (weeklyUsageDoc.exists) {
        // Update existing weekly usage record
        transaction.update(weeklyUsageRef, {
          callCount: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        })
      } else {
        // Create new weekly usage record
        transaction.set(weeklyUsageRef, {
          userId,
          weekId,
          startDate: admin.firestore.Timestamp.fromDate(weekStart),
          endDate: admin.firestore.Timestamp.fromDate(weekEnd),
          callCount: 1,
          created: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        })
      }
    })

    logger.info(`Recorded AI usage for user ${userId}, type: ${type}`)
  } catch (error) {
    logger.error('Error recording AI usage:', error)
    // Fail softly - don't block the user from getting their response
  }
}

/**
 * Check if user has reached their weekly AI usage limits
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Limit check results
 */
async function checkUserUsageLimits(userId) {
  try {
    // Get the current week start date
    const now = new Date()
    const weekStart = getWeekStartDate(now)
    const weekEnd = getWeekEndDate(now)
    const weekId = weekStart.toISOString().split('T')[0]

    // Check if user has unlimited access
    const userDoc = await admin.firestore().collection('users').doc(userId).get()
    const userData = userDoc.data() || {}

    if (userData.unlimitedAiAccess === true) {
      // User has unlimited access
      return {
        hasReachedLimit: false,
        currentUsage: 0,
        limit: Infinity,
        resetDate: weekEnd.toISOString()
      }
    }

    // Get the configured weekly limit
    const configDoc = await admin.firestore().collection('config').doc('aiLimits').get()
    const configData = configDoc.data() || {}
    const weeklyLimit = configData.weeklyCallLimit || 10 // Default if not configured

    // Get user's current weekly usage
    const weeklyUsageRef = admin.firestore().collection('aiWeeklyUsage').doc(`${userId}_${weekId}`)
    const weeklyUsageDoc = await weeklyUsageRef.get()
    const weeklyUsageData = weeklyUsageDoc.exists ? weeklyUsageDoc.data() : { callCount: 0 }

    // Check if user has reached their limit
    const hasReachedLimit = weeklyUsageData.callCount >= weeklyLimit

    return {
      hasReachedLimit,
      currentUsage: weeklyUsageData.callCount,
      limit: weeklyLimit,
      resetDate: weekEnd.toISOString()
    }
  } catch (error) {
    logger.error('Error checking user usage limits:', error)
    // In case of error, allow the user to proceed (fail open)
    return {
      hasReachedLimit: false,
      currentUsage: 0,
      limit: 10,
      resetDate: getWeekEndDate(new Date()).toISOString()
    }
  }
}

/**
 * Get the start date of the week (Sunday) for a given date
 * @param {Date} date - Date to find the week start for
 * @returns {Date} Week start date
 */
function getWeekStartDate(date) {
  const result = new Date(date)
  result.setDate(date.getDate() - date.getDay()) // Go back to Sunday
  result.setHours(0, 0, 0, 0) // Start of day
  return result
}

/**
 * Get the end date of the week (Saturday) for a given date
 * @param {Date} date - Date to find the week end for
 * @returns {Date} Week end date
 */
function getWeekEndDate(date) {
  const result = new Date(date)
  result.setDate(date.getDate() + (6 - date.getDay())) // Go forward to Saturday
  result.setHours(23, 59, 59, 999) // End of day
  return result
}
