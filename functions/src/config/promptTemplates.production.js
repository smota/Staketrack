/**
 * Production-Specific Prompt Templates
 * Overrides for the production environment
 */

// Import default templates
const defaultConfig = require('./promptTemplates.default.js')

// Deep clone the default templates
const templates = JSON.parse(JSON.stringify(defaultConfig.templates))

// Override specific templates for production
// For example, modifying the stakeholderRecommendationsJSON template for production
templates.stakeholderRecommendationsJSON = {
  ...templates.stakeholderRecommendationsJSON,
  instruction: 'As a senior stakeholder engagement consultant with expertise in strategic engagement planning, please analyze the following stakeholder map and provide detailed, actionable recommendations:'
  // Additional customizations specific to production can be added here
}

// You can override model configurations for production
const modelConfigs = {
  ...defaultConfig.modelConfigs,
  // Example of a production-specific model config override
  analytical: {
    ...defaultConfig.modelConfigs.analytical,
    temperature: 0.35,  // Lower temperature for more consistent results in production
    maxOutputTokens: 2000  // Increased token limit for production
  }
}

// Production safety settings might be stricter
const safetySettings = [
  ...defaultConfig.safetySettings
  // Add any additional production-specific safety settings
]

module.exports = {
  templates,
  modelConfigs,
  safetySettings
}
