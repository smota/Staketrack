import { AuthService } from '@/services/authService'

// Mock dependencies
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signOut: jest.fn()
}))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn()
}))

jest.mock('@/firebase', () => ({
  auth: {},
  db: {},
  analytics: {}
}))

// This is the key change: we mock the entire module,
// and the singleton instance is a property of the module.
jest.mock('@/services/localStorageService', () => ({
  localStorageService: {
    isAnonymousSessionActive: jest.fn(),
    setAnonymousSession: jest.fn()
  }
}))

const { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } = require('firebase/auth')
const { getDoc, setDoc } = require('firebase/firestore')
const { localStorageService } = require('@/services/localStorageService')

describe('Auth Service', () => {
  let authServiceInstance

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageService.isAnonymousSessionActive.mockReturnValue(false)
    authServiceInstance = new AuthService()
  })

  it('signs in with email and password', async () => {
    const user = { uid: '123' }
    signInWithEmailAndPassword.mockResolvedValue({ user })
    const result = await authServiceInstance.signInWithEmailPassword('test@test.com', 'password')
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.any(Object), 'test@test.com', 'password')
    expect(result).toEqual(user)
  })

  it('creates a user with email and password and creates a document', async () => {
    const user = { uid: '123', email: 'test@test.com' }
    createUserWithEmailAndPassword.mockResolvedValue({ user })
    getDoc.mockResolvedValue({ exists: () => false })
    const result = await authServiceInstance.createUserWithEmailPassword('test@test.com', 'password')
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.any(Object), 'test@test.com', 'password')
    expect(setDoc).toHaveBeenCalled()
    expect(result).toEqual(user)
  })

  it('signs in with Google', async () => {
    const user = { uid: '456' }
    signInWithPopup.mockResolvedValue({ user })
    getDoc.mockResolvedValue({ exists: () => true }) // Assume user exists
    const result = await authServiceInstance.signInWithGoogle()
    expect(signInWithPopup).toHaveBeenCalled()
    expect(result).toEqual(user)
  })

  it('signs out', async () => {
    await authServiceInstance.signOut()
    expect(signOut).toHaveBeenCalled()
  })

  it('starts and ends an anonymous session', () => {
    authServiceInstance.startLocalAnonymousSession()
    expect(authServiceInstance.isLocalAnonymous).toBe(true)
    expect(localStorageService.setAnonymousSession).toHaveBeenCalledWith(true)

    authServiceInstance.endLocalAnonymousSession()
    expect(authServiceInstance.isLocalAnonymous).toBe(false)
    expect(localStorageService.setAnonymousSession).toHaveBeenCalledWith(false)
  })

  it('returns the current user', () => {
    authServiceInstance.currentUser = { uid: '789' }
    expect(authServiceInstance.getCurrentUser()).toEqual({ uid: '789' })
  })

  it('returns an anonymous user when in an anonymous session', () => {
    localStorageService.isAnonymousSessionActive.mockReturnValue(true)
    const newAuthService = new AuthService()
    expect(newAuthService.isLocalAnonymous).toBe(true)
    expect(newAuthService.getCurrentUser()).toEqual({ uid: 'anonymous', isAnonymous: true })
  })

  it('handles auth state changes', () => {
    let authCallback
    onAuthStateChanged.mockImplementation((auth, cb) => {
      authCallback = cb
      return jest.fn() // onAuthStateChanged returns an unsubscribe function
    })

    const newAuthService = new AuthService()

    const user = { uid: '123' }
    authCallback(user)
    expect(newAuthService.currentUser).toEqual(user)
    expect(localStorageService.setAnonymousSession).toHaveBeenCalledWith(false)

    authCallback(null)
    expect(newAuthService.currentUser).toBeNull()
  })
})
