import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Login from '@/views/Login.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '@/services/authService'

// Mock dependencies
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  linkWithPopup: jest.fn(),
  signInWithCredential: jest.fn()
}))

jest.mock('@/services/authService', () => ({
  authService: {
    migrateLocalDataToFirestore: jest.fn(),
    startLocalAnonymousSession: jest.fn()
  }
}))

jest.mock('@/firebase', () => ({
  auth: jest.fn()
}))

const vuetify = createVuetify({ components, directives })

const routes = [
  { path: '/login', component: Login },
  { path: '/dashboard', component: { template: '<div>dashboard</div>' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

describe('Login.vue', () => {
  let wrapper

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks()

    router.push('/login')
    await router.isReady()
    wrapper = mount(Login, {
      global: {
        plugins: [vuetify, router]
      }
    })
  })

  it('renders sign in form by default', () => {
    expect(wrapper.text()).toContain('Sign In to StakeTrack')
    expect(wrapper.find('[data-testid="email-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="password-input"]').exists()).toBe(true)
  })

  it('signs in with email and password', async () => {
    const pushSpy = jest.spyOn(router, 'push')
    const signInMock = require('firebase/auth').signInWithEmailAndPassword
    signInMock.mockResolvedValue({ user: {} })

    await wrapper.find('[data-testid="email-input"] input').setValue('test@example.com')
    await wrapper.find('[data-testid="password-input"] input').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(signInMock).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    )
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('toggles to sign up mode and back', async () => {
    // go to sign up
    await wrapper.find('[data-testid="signup-link"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Sign Up for StakeTrack')
    let signUpButton = wrapper.find('[data-testid="signin-email-button"]')
    expect(signUpButton.text()).toContain('Sign Up with Email')

    // and back to sign in
    await wrapper.find('[data-testid="signup-link"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Sign In to StakeTrack')
    signUpButton = wrapper.find('[data-testid="signin-email-button"]')
    expect(signUpButton.text()).toContain('Sign In with Email')
  })

  it('signs up with email and password', async () => {
    await wrapper.find('[data-testid="signup-link"]').trigger('click')
    await flushPromises()

    const pushSpy = jest.spyOn(router, 'push')
    const signUpMock = require('firebase/auth').createUserWithEmailAndPassword
    signUpMock.mockResolvedValue({ user: {} })

    await wrapper.find('[data-testid="email-input"] input').setValue('new@example.com')
    await wrapper.find('[data-testid="password-input"] input').setValue('newpassword')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(signUpMock).toHaveBeenCalledWith(
      expect.anything(),
      'new@example.com',
      'newpassword'
    )
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('signs in with google', async () => {
    const pushSpy = jest.spyOn(router, 'push')
    const googleSignInMock = require('firebase/auth').signInWithPopup
    googleSignInMock.mockResolvedValue({ user: {} })

    await wrapper.find('[data-testid="google-signin-button"]').trigger('click')
    await flushPromises()

    expect(googleSignInMock).toHaveBeenCalled()
    expect(require('@/services/authService').authService.migrateLocalDataToFirestore).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('signs in anonymously', async () => {
    const pushSpy = jest.spyOn(router, 'push')
    const anonymousSignInMock = require('@/services/authService').authService.startLocalAnonymousSession

    await wrapper.find('[data-testid="anonymous-signin-button"]').trigger('click')
    await flushPromises()

    expect(anonymousSignInMock).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('shows an error message on failed login', async () => {
    const error = { message: 'Invalid credentials' }
    const signInMock = require('firebase/auth').signInWithEmailAndPassword
    signInMock.mockRejectedValue(error)

    await wrapper.find('[data-testid="email-input"] input').setValue('test@example.com')
    await wrapper.find('[data-testid="password-input"] input').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain(error.message)
  })
})
