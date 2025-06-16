// Add TextEncoder/TextDecoder for @opentelemetry and undici
const util = require('util')
global.TextEncoder = util.TextEncoder
global.TextDecoder = util.TextDecoder

// Add stream and fetch APIs for firebase v9+
const { ReadableStream } = require('stream/web')
global.ReadableStream = ReadableStream

// Polyfill for MessagePort
const { MessagePort } = require('worker_threads')
global.MessagePort = MessagePort

// Polyfill for ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock Firebase - using proper path
/* jest.mock('../src/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      add: jest.fn(),
      where: jest.fn().mockReturnThis(),
      get: jest.fn()
    }))
  },
  analytics: {
    logEvent: jest.fn()
  },
  app: {},
  storage: null,
  functions: {},
  getFunctionsInstance: jest.fn(),
  getFirebaseStorage: jest.fn(),
  getServicesStatus: jest.fn()
})) */

// Create DOM structure for testing
document.body.innerHTML = `
  <div id="app-container">
    <div id="auth-view" class="view"></div>
    <div id="dashboard-view" class="view hidden"></div>
    <div id="map-view" class="view hidden"></div>
  </div>
  <div id="modal-container" class="modal-container hidden"></div>
  <div id="tooltip" class="tooltip hidden"></div>
`
