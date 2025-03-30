#!/usr/bin/env node

/**
 * Test Firebase getConfig Function
 *
 * This script tests the Firebase getConfig function to verify it's correctly
 * providing configuration values from Firebase environment variables.
 *
 * Usage:
 * node scripts/test-config-function.js [environment]
 *
 * Environment: dev, staging, prod (defaults to dev)
 */

const { execSync } = require('child_process')

// Parse command line arguments
const args = process.argv.slice(2)
const environment = args[0]?.toLowerCase() || 'dev'

// Map environment to URL
let functionUrl
switch (environment) {
  case 'dev':
  case 'development':
    functionUrl = 'https://europe-west1-staketrack-dev.cloudfunctions.net/getConfig?env=development'
    break
  case 'staging':
    functionUrl = 'https://europe-west1-staketrack-dev.cloudfunctions.net/getConfig?env=staging'
    break
  case 'prod':
  case 'production':
    functionUrl = 'https://europe-west1-staketrack-prod.cloudfunctions.net/getConfig?env=production'
    break
  default:
    console.error('Invalid environment. Use dev, staging, or prod.')
    process.exit(1)
}

console.log(`\n🔍 Testing getConfig function for ${environment.toUpperCase()} environment...`)
console.log(`URL: ${functionUrl}`)

// Test if Firebase token is valid
try {
  console.log('\n🔑 Checking Firebase authentication...')
  execSync('firebase projects:list', { stdio: 'inherit' })
  console.log('✅ Firebase authentication is valid')
} catch (error) {
  console.error('❌ Firebase authentication failed. Please run firebase login and try again.')
  process.exit(1)
}

// Function to safely display sensitive values
function formatSensitiveValue(value) {
  if (!value) return '<empty>'
  if (typeof value !== 'string') return typeof value
  if (value.length <= 8) return '<too short>'
  return value.substring(0, 4) + '...' + value.substring(value.length - 4)
}

// Test the getConfig function
async function testConfigFunction() {
  try {
    // Dynamically import node-fetch
    const { default: fetch } = await import('node-fetch')

    const response = await fetch(functionUrl)

    if (!response.ok) {
      console.error(`❌ Function returned status ${response.status}: ${response.statusText}`)
      console.log('\nResponse headers:')
      for (const [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`)
      }

      const text = await response.text()
      console.log('\nResponse body:')
      console.log(text.substring(0, 1000)) // Show first 1000 chars in case of large response

      process.exit(1)
    }

    const config = await response.json()

    console.log('\n📋 Configuration received:')

    // Check for required fields
    const requiredFields = [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID'
    ]

    const missingFields = requiredFields.filter(field => !config[field])

    if (missingFields.length > 0) {
      console.error('❌ Some required fields are missing:')
      missingFields.forEach(field => console.log(`  - ${field}`))
    } else {
      console.log('✅ All required fields are present')
    }

    // Display configuration with sensitive values masked
    console.log('\nConfiguration values (sensitive values masked):')
    Object.entries(config).forEach(([key, value]) => {
      if (key.includes('API_KEY') || key.includes('APP_ID') || key.includes('MEASUREMENT_ID')) {
        console.log(`  ${key}: ${formatSensitiveValue(value)}`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    })

    // Check if configuration is marked as incomplete
    if (config.CONFIG_INCOMPLETE) {
      console.warn('\n⚠️ Configuration is marked as incomplete!')
      console.warn('This means some required values are missing from Firebase Functions configuration.')
      console.warn('To fix this, use the following command:')
      console.warn('\nfirebase use ' + (environment === 'prod' ? 'production' : 'development'))
      console.warn('firebase functions:config:set firebase.api_key="YOUR_API_KEY" firebase.auth_domain="YOUR_AUTH_DOMAIN" ...')
    } else {
      console.log('\n✅ Configuration is complete and valid')
    }

  } catch (error) {
    console.error('❌ Error testing function:', error.message)
    process.exit(1)
  }
}

// Run the test
testConfigFunction()
