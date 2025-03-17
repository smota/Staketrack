import { 
  signIn, 
  signOut, 
  register, 
  getCurrentUser, 
  updateUserProfile 
} from '../../js/services/authService';

// Mock dependencies
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn()
}));

describe('authService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in a user with valid credentials', async () => {
      // Arrange
      const mockUser = { uid: '123', email: 'test@example.com' };
      const mockSignInResult = { user: mockUser };
      const signInWithEmailAndPassword = require('firebase/auth').signInWithEmailAndPassword;
      signInWithEmailAndPassword.mockResolvedValue(mockSignInResult);

      // Act
      const result = await signIn('test@example.com', 'password123');

      // Assert
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw an error with invalid credentials', async () => {
      // Arrange
      const signInWithEmailAndPassword = require('firebase/auth').signInWithEmailAndPassword;
      signInWithEmailAndPassword.mockRejectedValue(new Error('Invalid credentials'));

      // Act & Assert
      await expect(signIn('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should sign out the current user', async () => {
      // Arrange
      const mockFirebaseSignOut = require('firebase/auth').signOut;
      mockFirebaseSignOut.mockResolvedValue(undefined);

      // Act
      await signOut();

      // Assert
      expect(mockFirebaseSignOut).toHaveBeenCalled();
    });
  });

  // Additional tests for register, getCurrentUser, updateUserProfile, etc.
}); 