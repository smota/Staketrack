// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('should display login page with all elements', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Check that we have the right page title
    await expect(page.locator('.text-h4')).toHaveText('Sign In to StakeTrack');

    // Check for email and password fields
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    // Check for auth buttons
    await expect(page.getByText('Sign In with Email')).toBeVisible();
    await expect(page.getByText('Google')).toBeVisible();
    await expect(page.getByText('Continue Anonymously')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Enter invalid email
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Email').blur();

    // Check for validation error
    await expect(page.getByText('Email must be valid')).toBeVisible();

    // Enter valid email
    await page.getByLabel('Email').fill('valid@example.com');
    await page.getByLabel('Email').blur();

    // Validation error should disappear
    await expect(page.getByText('Email must be valid')).not.toBeVisible();
  });

  test('should validate password length', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Enter short password
    await page.getByLabel('Password').fill('12345');
    await page.getByLabel('Password').blur();

    // Check for validation error
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();

    // Enter valid password
    await page.getByLabel('Password').fill('123456');
    await page.getByLabel('Password').blur();

    // Validation error should disappear
    await expect(page.getByText('Password must be at least 6 characters')).not.toBeVisible();
  });

  test('should toggle between login and signup modes', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Default mode should be login
    await expect(page.getByText('Sign In with Email')).toBeVisible();

    // Click on signup link
    await page.getByText('Sign up').click();

    // Check that we're now in signup mode
    await expect(page.getByText('Sign Up with Email')).toBeVisible();

    // Toggle back to login
    await page.getByText('Sign in').click();

    // Check that we're back in login mode
    await expect(page.getByText('Sign In with Email')).toBeVisible();
  });
}); 