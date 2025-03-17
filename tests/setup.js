import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('../../firebase/firebaseConfig.js', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  },
  firestore: {
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
  }
}));

// Create DOM structure for testing
document.body.innerHTML = `
  <div id="app-container">
    <div id="auth-view" class="view"></div>
    <div id="dashboard-view" class="view hidden"></div>
    <div id="map-view" class="view hidden"></div>
  </div>
  <div id="modal-container" class="modal-container hidden"></div>
  <div id="tooltip" class="tooltip hidden"></div>
`;

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
}); 