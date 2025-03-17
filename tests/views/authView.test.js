import { AuthView } from '../../js/views/authView';
// You might need to adjust these imports based on your actual implementation
import { fireEvent } from '@testing-library/dom';

describe('AuthView', () => {
  let authView;
  let container;

  beforeEach(() => {
    // Setup DOM elements for auth forms
    container = document.createElement('div');
    container.innerHTML = `
      <div id="login-form-container"></div>
      <div id="register-form-container" style="display: none;"></div>
      <div id="forgot-password-container" style="display: none;"></div>
    `;
    document.body.appendChild(container);
    
    // Initialize the view
    authView = new AuthView(container);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  test('renders login form by default', () => {
    const loginContainer = container.querySelector('#login-form-container');
    const registerContainer = container.querySelector('#register-form-container');
    
    expect(loginContainer.style.display).not.toBe('none');
    expect(registerContainer.style.display).toBe('none');
  });

  test('switches to registration form', () => {
    // Assuming there's a method to switch forms
    authView.showRegistrationForm();
    
    const loginContainer = container.querySelector('#login-form-container');
    const registerContainer = container.querySelector('#register-form-container');
    
    expect(loginContainer.style.display).toBe('none');
    expect(registerContainer.style.display).not.toBe('none');
  });

  test('handles login form submission', () => {
    // Create the login form
    const loginForm = document.createElement('form');
    loginForm.id = 'login-form';
    loginForm.innerHTML = `
      <input type="email" id="login-email" value="user@example.com">
      <input type="password" id="login-password" value="password123">
      <button type="submit">Login</button>
    `;
    container.querySelector('#login-form-container').appendChild(loginForm);
    
    // Mock login callback
    const onLoginMock = jest.fn();
    authView.onLogin(onLoginMock);
    
    // Submit the form
    fireEvent.submit(loginForm);
    
    // Verify callback was called with form data
    expect(onLoginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123'
    });
  });

  test('displays validation errors', () => {
    // Assuming there's a method to show errors
    const errors = {
      email: 'Email is required',
      password: 'Password must be at least 8 characters'
    };
    
    authView.showErrors(errors);
    
    // Check if error messages are displayed
    const errorElements = container.querySelectorAll('.error-message');
    expect(errorElements.length).toBeGreaterThan(0);
    
    // Check specific error messages
    const errorMessages = Array.from(errorElements).map(el => el.textContent);
    expect(errorMessages).toContain(errors.email);
    expect(errorMessages).toContain(errors.password);
  });

  test('clears validation errors on input change', () => {
    // First show some errors
    const errors = {
      email: 'Email is required'
    };
    authView.showErrors(errors);
    
    // Create email input if not exists
    if (!container.querySelector('#login-email')) {
      const emailInput = document.createElement('input');
      emailInput.id = 'login-email';
      container.querySelector('#login-form-container').appendChild(emailInput);
    }
    
    // Get the email input and error element
    const emailInput = container.querySelector('#login-email');
    const emailError = container.querySelector('.error-message');
    
    // Change the input value
    fireEvent.input(emailInput, { target: { value: 'new@example.com' } });
    
    // Check if error is cleared
    expect(emailError).not.toBeInTheDocument();
  });

  test('handles password reset request', () => {
    // Show the forgot password form
    authView.showForgotPasswordForm();
    
    // Create the form if not exists
    const forgotPasswordContainer = container.querySelector('#forgot-password-container');
    if (!forgotPasswordContainer.querySelector('form')) {
      const resetForm = document.createElement('form');
      resetForm.id = 'reset-form';
      resetForm.innerHTML = `
        <input type="email" id="reset-email" value="user@example.com">
        <button type="submit">Reset Password</button>
      `;
      forgotPasswordContainer.appendChild(resetForm);
    }
    
    // Mock reset callback
    const onResetMock = jest.fn();
    authView.onPasswordReset(onResetMock);
    
    // Submit the form
    const resetForm = forgotPasswordContainer.querySelector('#reset-form');
    fireEvent.submit(resetForm);
    
    // Verify callback was called with email
    expect(onResetMock).toHaveBeenCalledWith('user@example.com');
  });
}); 