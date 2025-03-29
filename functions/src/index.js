/**
 * StakeTrack Cloud Functions
 * Firebase Cloud Functions for secure configuration and API endpoints
 */

const { https, logger } = require('firebase-functions')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })
const { VertexAI } = require('@google-cloud/vertexai')

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp()
}

// Initialize Vertex AI
const projectId = process.env.GCLOUD_PROJECT
const location = 'us-central1'
const vertexAI = new VertexAI({ project: projectId, location })
const model = 'gemini-1.5-pro'

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
        currentUsage: usageLimits.currentUsage,
        limit: usageLimits.limit,
        resetDate: usageLimits.resetDate
      }
    }

    // Extract parameters
    const { stakeholderData, userQuestion } = data

    if (!stakeholderData) {
      return {
        success: false,
        message: 'Stakeholder data is required to generate recommendations.'
      }
    }

    // Prepare the content for the model
    let content = 'You are an expert stakeholder engagement consultant. Analyze the following stakeholder data and provide detailed recommendations for engagement:'

    content += '\n\nStakeholder Information:\n'
    content += `Name: ${stakeholderData.name || 'Unknown'}\n`
    content += `Organization: ${stakeholderData.organization || 'Unknown'}\n`
    content += `Role: ${stakeholderData.role || 'Unknown'}\n`
    content += `Influence Level: ${stakeholderData.influence || 'Unknown'}\n`
    content += `Support Level: ${stakeholderData.support || 'Unknown'}\n`
    content += `Key Interests: ${stakeholderData.interests || 'Unknown'}\n`

    if (stakeholderData.notes) {
      content += `Additional Notes: ${stakeholderData.notes}\n`
    }

    if (userQuestion) {
      content += `\nSpecific Question: ${userQuestion}\n`
    }

    content += `\nProvide specific, detailed recommendations for the following:
1. Communication Strategy: How to effectively communicate with this stakeholder
2. Engagement Frequency: How often to engage
3. Key Messages: What messages will resonate most
4. Potential Risks: What challenges might arise
5. Next Best Actions: 2-3 specific next steps

Format your response in clear sections with headers.`

    // Initialize the generative model
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
      generation_config: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        topK: 40,
        topP: 0.8
      },
      safety_settings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    })

    // Generate response
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: content }] }]
    })

    const response = result.response
    const usage = {
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    }

    // Record usage in Firestore
    await recordAIUsage(
      userId,
      'stakeholder-recommendations',
      model,
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

    // Update weekly aggregated usage
    const startOfWeek = getStartOfWeek()
    const weekId = startOfWeek.toISOString().split('T')[0]
    const weeklyUsageRef = admin.firestore().collection('aiWeeklyUsage').doc(`${userId}_${weekId}`)

    // Try to update the existing document
    const endOfWeek = getEndOfWeek(startOfWeek)
    await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(weeklyUsageRef)

      if (doc.exists) {
        // Update existing document
        transaction.update(weeklyUsageRef, {
          callCount: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        })
      } else {
        // Create new document
        transaction.set(weeklyUsageRef, {
          userId,
          weekId,
          startDate: admin.firestore.Timestamp.fromDate(startOfWeek),
          endDate: admin.firestore.Timestamp.fromDate(endOfWeek),
          callCount: 1,
          created: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        })
      }
    })

    logger.info(`Recorded AI usage for user ${userId}`)
    return true
  } catch (error) {
    logger.error('Error recording AI usage:', error)
    return false
  }
}

/**
 * Check if user has reached usage limits
 * @param {string} userId - User ID to check
 * @returns {Promise<Object>} Result with allowed status and usage info
 */
async function checkUserUsageLimits(userId) {
  try {
    // Check if user has unlimited access
    const userDoc = await admin.firestore().collection('users').doc(userId).get()
    if (userDoc.exists && userDoc.data().unlimitedAiAccess === true) {
      return { hasReachedLimit: false }
    }

    // Get system-wide limit configuration
    const configDoc = await admin.firestore().collection('config').doc('aiLimits').get()
    const weeklyLimit = configDoc.exists ? configDoc.data().weeklyCallLimit : 10 // Default to 10 if not configured

    // Get current week start and end dates
    const startOfWeek = getStartOfWeek()
    const endOfWeek = getEndOfWeek(startOfWeek)

    // Create a weekId based on the start date (format: YYYY-MM-DD)
    const weekId = startOfWeek.toISOString().split('T')[0]

    // Get user's weekly usage
    const weeklyUsageRef = admin.firestore().collection('aiWeeklyUsage').doc(`${userId}_${weekId}`)
    const weeklyUsageDoc = await weeklyUsageRef.get()

    if (!weeklyUsageDoc.exists) {
      return {
        hasReachedLimit: false,
        currentUsage: 0,
        limit: weeklyLimit,
        resetDate: endOfWeek.toISOString()
      }
    }

    const weeklyUsage = weeklyUsageDoc.data()
    const hasReachedLimit = weeklyUsage.callCount >= weeklyLimit

    return {
      hasReachedLimit,
      currentUsage: weeklyUsage.callCount,
      limit: weeklyLimit,
      resetDate: endOfWeek.toISOString()
    }
  } catch (error) {
    logger.error('Error checking usage limits:', error)
    // Default to not limiting in case of errors to prevent blocking legitimate requests
    return { hasReachedLimit: false }
  }
}

/**
 * Get the start of week (Sunday) for a given date
 * @param {Date} date - Date to get week start for
 * @returns {Date} Start of week date
 */
function getStartOfWeek() {
  const now = new Date()
  const day = now.getUTCDay() // 0 for Sunday, 1 for Monday, etc.
  const diff = now.getUTCDate() - day
  const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0))
  return startOfWeek
}

/**
 * Get the end of week (Saturday) for a given date
 * @param {Date} date - Date to get week end for
 * @returns {Date} End of week date
 */
function getEndOfWeek(startOfWeek) {
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6)
  endOfWeek.setUTCHours(23, 59, 59, 999)
  return endOfWeek
}
