import { createApp } from 'vue'
import { validateAppConfig } from '@/utils/configValidator'
import { checkFirebaseReadiness } from '@/utils/firebaseValidator'
import flushPromises from 'flush-promises'

// Mock dependencies
jest.mock('vue', () => ({
  ...jest.requireActual('vue'), // Import actual vue functions
  createApp: jest.fn(() => ({
    use: jest.fn(),
    mount: jest.fn(),
    config: {
      globalProperties: {}
    }
  })),
  defineComponent: jest.fn((obj) => obj) // Mock defineComponent
}))

const mockOnAuthStateChanged = jest.fn((auth, cb) => {
  // Immediately invoke with null user to simulate initial state
  cb(null)
  return () => { } // Return an unsubscribe function
})

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApp: jest.fn(),
  getApps: jest.fn(() => [])
}))

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  getAuth: jest.fn(() => ({
    onAuthStateChanged: mockOnAuthStateChanged
  }))
}))

jest.mock('@/firebase', () => ({
  auth: {
    onAuthStateChanged: mockOnAuthStateChanged
  },
  checkFirebaseReadiness: jest.fn().mockResolvedValue(true),
  getFunctionsInstance: jest.fn(),
  getFirebaseStorage: jest.fn()
}))

jest.mock('@/utils/firebaseValidator', () => ({
  checkFirebaseReadiness: jest.fn(() => Promise.resolve(true))
}))

jest.mock('@/utils/configValidator', () => ({
  validateAppConfig: jest.fn(() => ({
    isValid: true,
    capabilities: {},
    skipped: false
  }))
}))

jest.mock('@/router', () => ({}))
jest.mock('vuetify', () => ({
  createVuetify: jest.fn()
}))

// Mock stylesheet imports - MOVED to jest.config.js

describe('main.js', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env.VUE_APP_FIREBASE_API_KEY = 'test'
    process.env.VUE_APP_FIREBASE_AUTH_DOMAIN = 'test'
    process.env.VUE_APP_FIREBASE_PROJECT_ID = 'test'
    document.body.innerHTML = '<div id="app"></div>'
  })

  it('validates config and creates a Vue app', async () => {
    require('@/main.js')
    await flushPromises()
    expect(validateAppConfig).toHaveBeenCalled()
    expect(createApp).toHaveBeenCalled()
  })

  it('initializes Firebase checks on auth state change (logged in)', async () => {
    require('@/main.js')
    const user = { isAnonymous: false }
    // The second argument to the mock call is the callback
    const authCallback = mockOnAuthStateChanged.mock.calls[0][1]
    await authCallback(user)
    await flushPromises()
    expect(checkFirebaseReadiness).toHaveBeenCalled()
  })

  it('initializes Firebase checks on auth state change (anonymous)', async () => {
    require('@/main.js')
    const user = { isAnonymous: true }
    const authCallback = mockOnAuthStateChanged.mock.calls[0][1]
    await authCallback(user)
    await flushPromises()
    expect(checkFirebaseReadiness).toHaveBeenCalledWith(['app', 'auth', 'firestore', 'analytics'])
  })

  it('mounts the app only once', async () => {
    const app = createApp()
    require('@/main.js')
    const user = { isAnonymous: false }
    const authCallback = mockOnAuthStateChanged.mock.calls[0][1]

    await authCallback(user)
    await authCallback(user) // Call it again
    await flushPromises()

    expect(app.mount).toHaveBeenCalledTimes(1)
  })
})
