import router from '@/router'
import { getAuth } from 'firebase/auth'
import { getDoc } from 'firebase/firestore'
import { authService } from '@/services/authService'

// Mock dependencies
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null
  }))
}))

jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  doc: jest.fn()
}))

jest.mock('@/services/authService', () => ({
  authService: {
    isAuthenticated: jest.fn()
  }
}))

// Mock the entire firebase module to prevent side effects
jest.mock('@/firebase', () => ({}))

describe('Vue Router', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })

  it('allows guest to access public route', async () => {
    authService.isAuthenticated.mockReturnValue(false)
    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects unauthenticated user from protected route', async () => {
    authService.isAuthenticated.mockReturnValue(false)
    await router.push('/dashboard')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows authenticated user to access protected route', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    await router.push('/dashboard')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })

  it('redirects non-admin from admin route', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    getAuth.mockReturnValue({ currentUser: { uid: 'user1' } })
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ isAdmin: false }) })

    await router.push('/admin/settings')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('allows admin user to access admin route', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    getAuth.mockReturnValue({ currentUser: { uid: 'admin1' } })
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ isAdmin: true }) })

    await router.push('/admin/settings')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/admin/settings')
  })

  it('handles not found routes', async () => {
    await router.push('/some/non-existent/path')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('NotFound')
  })
})
