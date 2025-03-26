/**
 * Tests for environment configuration loader
 */

describe('Environment Configuration Loader', () => {
  let originalFetch
  let originalWindow

  beforeEach(() => {
    // Save original fetch and window.ENV
    originalFetch = global.fetch
    originalWindow = { ...window }

    // Reset window.ENV
    window.ENV = {}

    // Mock document and elements for alert testing
    document.body.innerHTML = `
      <div id="firebase-error-alert" class="hidden"></div>
      <button id="firebase-error-close"></button>
    `
  })

  afterEach(() => {
    // Restore original fetch and window
    global.fetch = originalFetch
    window = originalWindow

    // Clean up
    document.body.innerHTML = ''

    // Clean up any script tags that were added
    const scriptTags = document.querySelectorAll('script[src*="environmentLoader.js"]')
    scriptTags.forEach(tag => tag.remove())
  })

  test('should fetch configuration from the correct endpoint based on hostname', async () => {
    // Mock location
    Object.defineProperty(window, 'location', {
      value: { hostname: 'staketrack.com' },
      writable: true
    })

    // Mock successful fetch response
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ENVIRONMENT: 'PRD',
          FIREBASE_API_KEY: 'test-api-key',
          FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
          FIREBASE_PROJECT_ID: 'test-project-id'
        })
      })
    )

    // Load the environment loader script
    await import('../../js/utils/environmentLoader.js')

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify fetch was called with the right URL
    expect(global.fetch).toHaveBeenCalledWith('/api/config')

    // Verify ENV was populated correctly
    expect(window.ENV).toEqual({
      ENVIRONMENT: 'PRD',
      FIREBASE_API_KEY: 'test-api-key',
      FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
      FIREBASE_PROJECT_ID: 'test-project-id'
    })
  })

  test('should handle fetch errors gracefully', async () => {
    // Mock location
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true
    })

    // Mock failed fetch
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.reject(new Error('Network error'))
    )

    // Mock console.error
    console.error = jest.fn()

    // Load the environment loader script
    await import('../../js/utils/environmentLoader.js')

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error loading environment configuration:',
      expect.any(Error)
    )

    // Verify fallback ENV was set
    expect(window.ENV.ENVIRONMENT).toBe('DEV')
    expect(window.ENV.FIREBASE_USE_EMULATOR).toBe(true)

    // Verify error alert was shown
    const alertEl = document.getElementById('firebase-error-alert')
    expect(alertEl.classList.contains('hidden')).toBe(false)
  })

  test('should use development config for localhost', async () => {
    // Mock location
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true
    })

    // Mock successful fetch response
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ENVIRONMENT: 'DEV',
          FIREBASE_API_KEY: 'dev-api-key',
          USE_EMULATORS: 'true'
        })
      })
    )

    // Load the environment loader script
    await import('../../js/utils/environmentLoader.js')

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify fetch was called with the right URL
    expect(global.fetch).toHaveBeenCalledWith('/config/dev.json')

    // Verify ENV was populated correctly
    expect(window.ENV).toEqual({
      ENVIRONMENT: 'DEV',
      FIREBASE_API_KEY: 'dev-api-key',
      USE_EMULATORS: 'true'
    })
  })
})
