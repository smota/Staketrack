import '@testing-library/jest-dom';

// Mock Firebase
const mockFirebase = {
  auth: jest.fn(() => ({
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn();
    }),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
    signOut: jest.fn().mockResolvedValue(),
    getUser: jest.fn().mockResolvedValue({ uid: 'test-uid' }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
    currentUser: {
      updateProfile: jest.fn().mockResolvedValue()
    }
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ data: () => ({}) }),
        set: jest.fn().mockResolvedValue(),
        update: jest.fn().mockResolvedValue(),
        delete: jest.fn().mockResolvedValue()
      })),
      where: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ docs: [] })
      })),
      orderBy: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ docs: [] })
      }))
    }))
  })),
  analytics: jest.fn(() => ({
    logEvent: jest.fn()
  }))
};

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: jest.fn(() => ({
    destroy: jest.fn(),
    update: jest.fn()
  }))
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);

// Mock leaflet
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    setLatLng: jest.fn(),
    bindPopup: jest.fn()
  })),
  icon: jest.fn()
}));

// Mock User model
jest.mock('../js/models/user.js', () => ({
  __esModule: true,
  default: class User {
    constructor(data = {}) {
      this.id = data.id || null;
      this.email = data.email || '';
      this.displayName = data.displayName || '';
      this.photoURL = data.photoURL || '';
    }
    static getCurrentUser = jest.fn();
    static findOne = jest.fn();
    static create = jest.fn();
    update = jest.fn();
  }
}));

// Mock Stakeholder model
jest.mock('../js/models/stakeholder.js', () => ({
  __esModule: true,
  default: class Stakeholder {
    constructor(data = {}) {
      this.id = data.id || null;
      this.name = data.name || '';
      this.influence = data.influence || 0;
      this.interest = data.interest || 0;
    }
    static getAll = jest.fn();
    static findById = jest.fn();
    static create = jest.fn();
    update = jest.fn();
    delete = jest.fn();
  }
}));

// Setup DOM environment
function setupTestDOM() {
  // Create main container
  const container = document.createElement('div');
  container.id = 'app';
  document.body.appendChild(container);

  // Create navigation elements
  const nav = document.createElement('nav');
  nav.id = 'main-nav';
  container.appendChild(nav);

  const loginBtn = document.createElement('button');
  loginBtn.id = 'login-btn';
  nav.appendChild(loginBtn);

  // Create auth elements
  const authContainer = document.createElement('div');
  authContainer.id = 'auth-container';
  container.appendChild(authContainer);

  const authToggleBtn = document.createElement('button');
  authToggleBtn.id = 'auth-toggle-btn';
  authContainer.appendChild(authToggleBtn);

  const skipAuthBtn = document.createElement('button');
  skipAuthBtn.id = 'skip-auth-btn';
  authContainer.appendChild(skipAuthBtn);

  // Create stakeholder elements
  const stakeholderContainer = document.createElement('div');
  stakeholderContainer.id = 'stakeholder-container';
  container.appendChild(stakeholderContainer);

  const addStakeholderBtn = document.createElement('button');
  addStakeholderBtn.id = 'add-stakeholder-btn';
  stakeholderContainer.appendChild(addStakeholderBtn);

  const stakeholderList = document.createElement('div');
  stakeholderList.id = 'stakeholder-list';
  stakeholderContainer.appendChild(stakeholderList);

  // Create map elements
  const mapContainer = document.createElement('div');
  mapContainer.id = 'map-container';
  container.appendChild(mapContainer);

  const createMapBtn = document.createElement('button');
  createMapBtn.id = 'create-map-btn';
  mapContainer.appendChild(createMapBtn);

  // Create modal elements
  const modal = document.createElement('div');
  modal.id = 'modal';
  container.appendChild(modal);

  const modalClose = document.createElement('button');
  modalClose.id = 'modal-close';
  modal.appendChild(modalClose);

  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.classList.add('hidden');
  container.appendChild(tooltip);
}

// Setup before each test
beforeEach(() => {
  // Setup DOM
  setupTestDOM();

  // Setup global mocks
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  global.firebase = mockFirebase;

  // Clear all mocks
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  // Clean up DOM
  document.body.innerHTML = '';

  // Reset fetch mock
  global.fetch.mockClear();

  // Reset localStorage mock
  Object.values(localStorageMock).forEach(mock => mock.mockClear());
}); 