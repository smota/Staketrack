import authController from '../js/controllers/authController.js'
import { auth } from '../../firebase/firebaseConfig.js'
import userModel from '../js/models/userModel.js'
import { EventBus } from '../js/utils/eventBus.js'

jest.mock('../js/models/userModel.js', () => ({
  setCurrentUser: jest.fn(),
  getCurrentUser: jest.fn(),
  clearCurrentUser: jest.fn()
}))

jest.mock('../js/utils/eventBus.js', () => ({
  EventBus: {
    on: jest.fn(),
    emit: jest.fn()
  }
}))

describe('Authentication Flow Integration', () => {
  const mockUser = {
    uid: 'test123',
    email: 'test@example.com',
    displayName: 'Test User'
  }

  beforeEach(() => {
    // Set up DOM elements for auth testing
    document.body.innerHTML = `
      <div id="auth-view"></div>
      <div id="login-btn"></div>
      <div id="auth-container"></div>
      <div id="user-profile" class="hidden">
        <span id="user-email"></span>
      </div>
      <form id="email-auth-form">
        <input type="email" id="auth-email">
        <input type="password" id="auth-password">
        <button type="submit" id="email-auth-btn">Sign In</button>
      </form>
      <p class="auth-toggle">
        <span id="auth-toggle-text">Don't have an account?</span>
        <button id="auth-toggle-btn" class="btn btn-text">Sign Up</button>
      </p>
      <button id="google-auth-btn">Continue with Google</button>
      <button id="microsoft-auth-btn">Continue with Microsoft</button>
      <button id="skip-auth-btn">Continue without signing in</button>
    `

    // Reset mocks
    jest.clearAllMocks()

    // Add window.firebase mock
    window.firebase = {
      auth: {
        GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
        OAuthProvider: jest.fn().mockImplementation(() => ({}))
      }
    }

    // Add mock firebaseAuth
    window.firebaseAuth = auth

    // Add mock analytics
    window.firebaseAnalytics = {
      logEvent: jest.fn(),
      setUserId: jest.fn()
    }

    // Initialize the auth controller
    authController.init()
  })

  test('should handle user login', async () => {
    // Setup mocks
    auth.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser })

    // Trigger login
    const emailInput = document.getElementById('auth-email')
    const passwordInput = document.getElementById('auth-password')
    const form = document.getElementById('email-auth-form')

    emailInput.value = 'test@example.com'
    passwordInput.value = 'password123'

    // Simulate form submission
    form.dispatchEvent(new Event('submit'))

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assertions
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123')

    // Analytics should be called
    expect(window.firebaseAnalytics.logEvent).toHaveBeenCalled()
  })

  test('should handle login error', async () => {
    // Setup mocks
    const mockError = new Error('Invalid email or password')
    mockError.code = 'auth/invalid-credential'
    auth.signInWithEmailAndPassword.mockRejectedValue(mockError)

    // Spy on alert
    jest.spyOn(window, 'alert').mockImplementation(() => { })

    // Trigger login
    const emailInput = document.getElementById('auth-email')
    const passwordInput = document.getElementById('auth-password')
    const form = document.getElementById('email-auth-form')

    emailInput.value = 'test@example.com'
    passwordInput.value = 'wrongpassword'

    // Simulate form submission
    form.dispatchEvent(new Event('submit'))

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assertions
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
    expect(window.alert).toHaveBeenCalled()
    expect(EventBus.emit).toHaveBeenCalledWith('auth:error', mockError)
    expect(window.firebaseAnalytics.logEvent).toHaveBeenCalledWith('auth_error', expect.any(Object))
  })

  test('should handle user logout', async () => {
    // Setup
    const logoutBtn = document.createElement('button')
    logoutBtn.id = 'logout-btn'
    document.body.appendChild(logoutBtn)

    // Mock auth.signOut
    auth.signOut = jest.fn().mockResolvedValue()

    // Trigger logout
    logoutBtn.click()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assertions
    expect(auth.signOut).toHaveBeenCalled()
  })
})
