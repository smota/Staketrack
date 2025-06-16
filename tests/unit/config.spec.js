/**
 * Unit tests for the application configuration.
 * @module tests/unit/config.spec
 */

describe('src/config/index.js', () => {
  let originalEnv

  beforeEach(() => {
    // To isolate environment variables for each test, we reset modules
    jest.resetModules()
    // Keep a copy of the original process.env
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv
  })

  // Test suite for config values based on environment variables
  describe('Configuration Values', () => {
    it('should use default values when no environment variables are set', () => {
      // Unset all relevant environment variables
      delete process.env.NODE_ENV
      delete process.env.VUE_APP_ENVIRONMENT
      delete process.env.VUE_APP_FIREBASE_API_KEY

      const config = require('@/config').default

      // Check default values
      expect(config.env.name).toBe('STAGING') // Fallback logic
      expect(config.env.isDevelopment).toBe(false)
      expect(config.env.firebaseConfig.apiKey).toBe('')
      expect(config.features.useEmulators).toBe(false)
    })

    it('should correctly set configuration for development environment', () => {
      process.env.NODE_ENV = 'development'
      process.env.VUE_APP_ENVIRONMENT = 'DEVELOPMENT'
      process.env.VUE_APP_USE_EMULATORS = 'true'
      process.env.VUE_APP_FIREBASE_API_KEY = 'dev-key'
      process.env.VUE_APP_CORS_ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:8080'
      process.env.VUE_APP_RATE_LIMIT_API_PER_MINUTE = '120'

      const config = require('@/config').default

      // Assertions for development
      expect(config.env.name).toBe('DEVELOPMENT')
      expect(config.env.isDevelopment).toBe(true)
      expect(config.features.useEmulators).toBe(true)
      expect(config.env.firebaseConfig.apiKey).toBe('dev-key')
      expect(config.security.cors.allowedOrigins).toEqual(['http://localhost:3000', 'http://localhost:8080'])
      expect(config.security.rateLimit.api.maxRequestsPerMinute).toBe(120)
    })

    it('should correctly set configuration for production environment', () => {
      process.env.NODE_ENV = 'production'
      process.env.VUE_APP_ENVIRONMENT = 'PRODUCTION'
      process.env.VUE_APP_ENABLE_ANALYTICS = 'true'
      process.env.VUE_APP_CORS_ALLOWED_ORIGINS = 'https://staketrack.app'

      const config = require('@/config').default

      // Assertions for production
      expect(config.env.name).toBe('PRODUCTION')
      expect(config.env.isProduction).toBe(true)
      expect(config.features.enableAnalytics).toBe(true)
      expect(config.security.cors.allowedOrigins).toEqual(['https://staketrack.app'])
    })

    it('should correctly set configuration for staging environment', () => {
      process.env.NODE_ENV = 'staging'
      process.env.VUE_APP_ENVIRONMENT = 'STAGING'

      const config = require('@/config').default

      expect(config.env.name).toBe('STAGING')
      expect(config.env.isStaging).toBe(true)
    })

    it('should use default CORS origins for production when not specified', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.VUE_APP_CORS_ALLOWED_ORIGINS

      const config = require('@/config').default

      expect(config.security.cors.allowedOrigins).toEqual(['https://staketrack-prod.web.app', 'https://staketrack.app'])
    })

    it('should correctly parse boolean flags for feature flags', () => {
      process.env.VUE_APP_USE_LOCAL_STORAGE = 'true'
      process.env.VUE_APP_ENABLE_ANALYTICS = 'false'
      process.env.VUE_APP_ENABLE_AI_RECOMMENDATIONS = '1'
      process.env.VUE_APP_ENABLE_SHARING = 0

      const config = require('@/config').default

      expect(config.features.useLocalStorage).toBe(true)
      expect(config.features.enableAnalytics).toBe(false)
      expect(config.features.enableAIRecommendations).toBe(true)
      expect(config.features.enableSharing).toBe(false)
    })
  })
})
