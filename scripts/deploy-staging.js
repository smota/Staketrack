#!/usr/bin/env node

/**
 * Staging Deployment Script
 *
 * This script builds the application for the staging environment
 * and deploys it to Firebase hosting.
 */

const { execSync } = require('child_process')

// Execute build and deployment commands
try {
  // Update Firebase configuration before building
  console.log('🔧 Updating Firebase configuration for staging...')
  execSync('node scripts/update-firebase-config.js --env=staging --no-confirm', {
    stdio: 'inherit'
  })

  // Build using npm script with the correct mode for Vue CLI
  console.log('📦 Building application for staging...')
  execSync('vue-cli-service build --mode staging', {
    stdio: 'inherit'
  })

  // Deploy to Firebase
  console.log('🚀 Deploying to Firebase staging...')
  execSync('firebase use staketrack-dev && firebase deploy --only hosting:staging', {
    stdio: 'inherit'
  })

  console.log('✅ Deployment to staging completed successfully!')
} catch (error) {
  console.error('❌ Deployment failed:', error.message)
  process.exit(1)
}
