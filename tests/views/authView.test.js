import { AuthView } from '../../js/views/authView'
import { EventBus } from '../../js/utils/eventBus'
import { fireEvent } from '@testing-library/dom'
import authService from '../../js/services/authService'

// Mock dependencies
jest.mock('../../js/utils/eventBus', () => ({
  EventBus: {
    on: jest.fn(),
    emit: jest.fn()
  }
}))

jest.mock('../../js/services/authService', () => ({
  signInWithEmailPassword: jest.fn(),
  createUserWithEmailPassword: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithMicrosoft: jest.fn()
}))

describe('AuthView', () => {
  let container

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Setup window analytics mock
    window.firebaseAnalytics = {
      trackEvent: jest.fn(),
      trackPageView: jest.fn()
    }

    // Setup DOM elements for auth forms
    container = document.createElement('div')
    container.innerHTML = `
      <div id="auth-view" class="view">
        <div class="auth-container">
          <h2>Sign in to StakeTrack</h2>
          <div class="auth-providers">
            <button id="google-auth-btn" class="btn btn-provider">Continue with Google</button>
            <button id="microsoft-auth-btn" class="btn btn-provider">Continue with Microsoft</button>
          </div>
          <form id="email-auth-form">
            <div class="form-group">
              <label for="auth-email">Email</label>
              <input type="email" id="auth-email" required>
            </div>
            <div class="form-group">
              <label for="auth-password">Password</label>
              <input type="password" id="auth-password" required>
            </div>
            <button type="submit" id="email-auth-btn" class="btn btn-primary">Sign In</button>
          </form>
          <p class="auth-toggle">
            <span id="auth-toggle-text">Don't have an account?</span>
            <button id="auth-toggle-btn" class="btn btn-text">Sign Up</button>
          </p>
          <button id="skip-auth-btn" class="btn btn-text">Continue without signing in</button>
        </div>
      </div>
    `
    document.body.appendChild(container)
  })

  afterEach(() => {
    // Clean up
    document.body.removeChild(container)
    jest.restoreAllMocks()
  })

  test('initializes correctly', () => {
    // Create a new instance
    const authView = new AuthView()

    // Check that elements are properly initialized
    expect(authView.viewElement).not.toBeNull()
    expect(authView.authForm).not.toBeNull()
    expect(authView.isSignUp).toBe(false)
  })

  test('shows and hides the view', () => {
    const authView = new AuthView()

    // Test show
    authView.show()
    expect(authView.viewElement.classList.contains('hidden')).toBe(false)
    expect(window.firebaseAnalytics.trackPageView).toHaveBeenCalledWith('auth')

    // Test hide
    authView.hide()
    expect(authView.viewElement.classList.contains('hidden')).toBe(true)
  })

  test('toggles between sign in and sign up mode', () => {
    const authView = new AuthView()
    const toggleBtn = document.getElementById('auth-toggle-btn')

    // Initial state is sign in
    expect(authView.isSignUp).toBe(false)
    expect(document.getElementById('email-auth-btn').textContent).toBe('Sign In')

    // Toggle to sign up
    toggleBtn.click()
    expect(authView.isSignUp).toBe(true)
    expect(document.getElementById('email-auth-btn').textContent).toBe('Sign Up')
    expect(window.firebaseAnalytics.trackEvent).toHaveBeenCalledWith('auth_toggle', {
      mode: 'signup'
    })

    // Toggle back to sign in
    toggleBtn.click()
    expect(authView.isSignUp).toBe(false)
    expect(document.getElementById('email-auth-btn').textContent).toBe('Sign In')
    expect(window.firebaseAnalytics.trackEvent).toHaveBeenCalledWith('auth_toggle', {
      mode: 'signin'
    })
  })

  test('handles email sign in submission', async () => {
    // Setup
    const authView = new AuthView()
    authService.signInWithEmailPassword.mockResolvedValue({ user: { email: 'test@example.com' } })

    // Fill form
    const emailInput = document.getElementById('auth-email')
    const passwordInput = document.getElementById('auth-password')
    const form = document.getElementById('email-auth-form')

    emailInput.value = 'test@example.com'
    passwordInput.value = 'password123'

    // Submit form
    form.dispatchEvent(new Event('submit'))

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assertions
    expect(authService.signInWithEmailPassword).toHaveBeenCalledWith('test@example.com', 'password123')
    expect(window.firebaseAnalytics.trackEvent).toHaveBeenCalledWith('auth_signin', { method: 'email' })
  })

  test('handles email sign up submission', async () => {
    // Setup
    const authView = new AuthView()
    authService.createUserWithEmailPassword.mockResolvedValue({ user: { email: 'test@example.com' } })

    // Toggle to sign up mode
    document.getElementById('auth-toggle-btn').click()

    // Fill form
    const emailInput = document.getElementById('auth-email')
    const passwordInput = document.getElementById('auth-password')
    const form = document.getElementById('email-auth-form')

    emailInput.value = 'test@example.com'
    passwordInput.value = 'password123'

    // Submit form
    form.dispatchEvent(new Event('submit'))

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assertions
    expect(authService.createUserWithEmailPassword).toHaveBeenCalledWith('test@example.com', 'password123')
    expect(window.firebaseAnalytics.trackEvent).toHaveBeenCalledWith('auth_signup', { method: 'email' })
  })

  test('handles Google sign in', async () => {
    // Setup
    const authView = new AuthView()
    authService.signInWithGoogle.mockResolvedValue({ user: { email: 'test@example.com' } })

    // Click Google button
    document.getElementById('google-auth-btn').click()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assertions
    expect(authService.signInWithGoogle).toHaveBeenCalled()
    expect(window.firebaseAnalytics.trackEvent).toHaveBeenCalledWith('auth_signin', { method: 'google' })
  })

  test('handles skip auth button', () => {
    // Setup
    const authView = new AuthView()

    // Click skip button
    document.getElementById('skip-auth-btn').click()

    // Assertions
    expect(EventBus.emit).toHaveBeenCalledWith('auth:skip')
    expect(window.firebaseAnalytics.trackEvent).toHaveBeenCalledWith('auth_skip')
  })

  test('handles auth errors', async () => {
    // Setup
    const authView = new AuthView()
    const mockError = new Error('Invalid credentials')
    authService.signInWithEmailPassword.mockRejectedValue(mockError)

    // Spy on alert
    jest.spyOn(window, 'alert').mockImplementation(() => { })

    // Fill form
    const emailInput = document.getElementById('auth-email')
    const passwordInput = document.getElementById('auth-password')
    const form = document.getElementById('email-auth-form')

    emailInput.value = 'test@example.com'
    passwordInput.value = 'password123'

    // Submit form
    form.dispatchEvent(new Event('submit'))

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assertions
    expect(window.alert).toHaveBeenCalled()
    expect(EventBus.emit).toHaveBeenCalledWith('auth:error', mockError)
    expect(window.firebaseAnalytics.trackEvent).toHaveBeenCalledWith('auth_error', expect.objectContaining({
      method: 'email',
      error_message: mockError.message
    }))
  })
})
