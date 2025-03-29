#!/usr/bin/env node

/**
 * Prompt Templates Deployment Script
 *
 * This script copies the appropriate environment-specific prompt templates
 * based on the deployment environment (production, development, or local).
 *
 * Usage:
 * node deploy-prompts.js [environment]
 *
 * Example:
 * node deploy-prompts.js production
 */

const fs = require('fs')
const path = require('path')

// Get target environment from command line arguments or default to development
const env = process.argv[2] || 'development'
const validEnvs = ['production', 'development', 'local']

if (!validEnvs.includes(env)) {
  console.error(`Invalid environment: ${env}`)
  console.error(`Valid environments: ${validEnvs.join(', ')}`)
  process.exit(1)
}

// Source and destination paths
const sourceDir = path.join(__dirname, 'src', 'config')
const sourceFile = path.join(sourceDir, `promptTemplates.${env}.js`)
const defaultFile = path.join(sourceDir, 'promptTemplates.default.js')

// Check if environment-specific file exists
if (!fs.existsSync(sourceFile)) {
  console.warn(`Warning: No specific prompt templates for ${env} environment found.`)
  console.warn(`Will use default templates (${defaultFile}).`)
}

// Set NODE_ENV environment variable in a .env file for the functions
const envFileContent = `NODE_ENV=${env}`
fs.writeFileSync(path.join(__dirname, '.env'), envFileContent)
console.log(`Set NODE_ENV=${env} in .env file`)

console.log(`Prompt templates configured for ${env} environment`)
console.log('To deploy the functions, run:')
console.log('  firebase deploy --only functions')
