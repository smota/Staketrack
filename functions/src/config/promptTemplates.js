/**
 * Prompt Templates Configuration
 * Environment-specific AI prompt templates
 */
const fs = require('fs')
const path = require('path')

// Get environment from environment variable or default to local
const ENV = process.env.NODE_ENV || 'local'

// Load environment-specific configuration
let promptConfig

try {
  // Try to load environment specific config
  const configPath = path.join(__dirname, `promptTemplates.${ENV}.js`)
  if (fs.existsSync(configPath)) {
    promptConfig = require(`./promptTemplates.${ENV}.js`)
  } else {
    // Fall back to default config
    promptConfig = require('./promptTemplates.default.js')
    console.warn(`No prompt templates found for environment ${ENV}, using default templates`)
  }
} catch (error) {
  console.error(`Error loading prompt templates: ${error.message}`)
  // Provide minimal fallback configuration
  promptConfig = require('./promptTemplates.default.js')
}

/**
 * Get template content for a specific template key
 * @param {string} templateKey - The template key to retrieve
 * @param {Object} options - Optional parameters for customizing the template
 * @returns {Object} Template components (instruction, context pattern, outputFormat)
 */
function getTemplate(templateKey, options = {}) {
  // Check if template exists
  if (!promptConfig.templates[templateKey]) {
    console.warn(`Template not found: ${templateKey}, using fallback template`)
    return promptConfig.templates.fallback
  }

  // Get the template
  return promptConfig.templates[templateKey]
}

/**
 * Build a prompt from data and template
 * @param {string} templateKey - Template key to use
 * @param {Object} data - Data to populate the template
 * @param {Object} options - Additional options
 * @returns {string} Formatted prompt
 */
function buildPrompt(templateKey, data, options = {}) {
  const template = getTemplate(templateKey, options)

  // Process instruction (usually static)
  const instruction = template.instruction

  // Process context (needs data substitution)
  let context = template.contextPattern

  // Replace variables in the context pattern
  if (data) {
    // Process object fields and arrays
    Object.keys(data).forEach(key => {
      // Handle arrays with special formatting
      if (Array.isArray(data[key])) {
        const arrayFormatPattern = template.arrayFormats?.[key] || '${item}'
        const formattedArray = data[key].map(item => {
          let formattedItem = arrayFormatPattern

          // If item is an object, replace all possible fields
          if (typeof item === 'object') {
            Object.keys(item).forEach(field => {
              formattedItem = formattedItem.replace(`\${${field}}`, item[field] || '')
            })
          } else {
            // Simple value
            formattedItem = formattedItem.replace('${item}', item || '')
          }

          return formattedItem
        }).join('\n')

        // Replace array placeholder with formatted content
        context = context.replace(`\${${key}}`, formattedArray)
      } else if (typeof data[key] === 'object') {
        // Handle nested objects (simple one level replacement)
        Object.keys(data[key]).forEach(nestedKey => {
          context = context.replace(
            `\${${key}.${nestedKey}}`,
            data[key][nestedKey] || ''
          )
        })
      } else {
        // Handle simple values
        context = context.replace(`\${${key}}`, data[key] || '')
      }
    })
  }

  // Process output format (might need variable substitution)
  let outputFormat = template.outputFormat

  // Replace any variables in output format
  if (data) {
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string' || typeof data[key] === 'number') {
        outputFormat = outputFormat.replace(`\${${key}}`, data[key] || '')
      }
    })
  }

  // Apply optional special sections if provided in options
  if (options.specialFocus) {
    context += `\n\nPlease focus specifically on: ${options.specialFocus}`
  }

  // Combine all parts into final prompt
  return `${instruction.trim()}\n\n${context.trim()}\n\n${outputFormat.trim()}`
}

/**
 * Get model configuration for a specific template
 * @param {string} templateKey - The template key
 * @param {Object} options - Optional override parameters
 * @returns {Object} Model configuration
 */
function getModelConfig(templateKey, options = {}) {
  const template = getTemplate(templateKey, options)

  // Get model config with overrides from options
  return {
    ...promptConfig.modelConfigs[template.modelConfig || 'default'],
    ...options.modelOverrides
  }
}

module.exports = {
  getTemplate,
  buildPrompt,
  getModelConfig,
  modelConfigs: promptConfig.modelConfigs,
  safetySettings: promptConfig.safetySettings
}
