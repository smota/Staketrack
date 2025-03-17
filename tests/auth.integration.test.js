import authController from '../js/controllers/authController.js';
import { auth } from '../../firebase/firebaseConfig.js';
import userModel from '../js/models/userModel.js';

jest.mock('../js/models/userModel.js', () => ({
  setCurrentUser: jest.fn(),
  getCurrentUser: jest.fn(),
  clearCurrentUser: jest.fn()
}));

describe('Authentication Flow Integration', () => {
  const mockUser = { 
    uid: 'test123', 
    email: 'test@example.com',
    displayName: 'Test User'
  };
  
  beforeEach(() => {
    // Set up DOM elements for auth testing
    document.body.innerHTML = `
      <div id="login-btn"></div>
      <div id="auth-container"></div>
      <div id="user-profile" class="hidden">
        <span id="user-email"></span>
      </div>
      <form id="email-auth-form">
        <input type="email" id="auth-email">
        <input type="password" id="auth-password">
      </form>
    `;
    
    // Initialize the auth controller
    authController.init();
  });
  
  test('should handle user login', async () => {
    // Setup mocks
    auth.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    
    // Trigger login
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const form = document.getElementById('email-auth-form');
    
    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';
    
    // Simulate form submission
    form.dispatchEvent(new Event('submit'));
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Assertions
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(userModel.setCurrentUser).toHaveBeenCalled();
  });
  
  test('should handle user logout', async () => {
    // Setup
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    document.body.appendChild(logoutBtn);
    
    // Trigger logout
    logoutBtn.click();
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Assertions
    expect(auth.signOut).toHaveBeenCalled();
    expect(userModel.clearCurrentUser).toHaveBeenCalled();
  });
}); 