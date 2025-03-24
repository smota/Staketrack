export const auth = {
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
};

export const firestore = {
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
};

export const analytics = {
  logEvent: jest.fn()
}; 