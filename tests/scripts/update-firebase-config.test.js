/**
 * Tests for Firebase config updater script
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');
jest.mock('readline', () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((query, callback) => callback('y')),
    close: jest.fn()
  })
}));

// Sample env content for testing
const mockEnvContent = `
ENVIRONMENT=DEV
FIREBASE_API_KEY=test-api-key
FIREBASE_AUTH_DOMAIN=test-auth-domain.firebaseapp.com
FIREBASE_PROJECT_ID=test-project-id
FIREBASE_STORAGE_BUCKET=test-storage-bucket.appspot.com
FIREBASE_MESSAGING_SENDER_ID=12345
FIREBASE_APP_ID=1:12345:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXX
USE_EMULATORS=true
`;

describe('Firebase Config Updater Script', () => {
  // Save original process.argv and env
  const originalArgv = process.argv;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock file exists check
    fs.existsSync = jest.fn().mockReturnValue(true);

    // Mock file read
    fs.readFileSync = jest.fn().mockReturnValue(mockEnvContent);

    // Mock execSync
    execSync.mockImplementation(() => 'Command executed');

    // Set up process.argv for testing
    process.argv = ['node', 'update-firebase-config.js', '--env=dev', '--no-confirm'];

    // Reset process.env
    process.env = { ...originalEnv };
    delete process.env.CI;
    delete process.env.FIREBASE_TOKEN;
  });

  afterEach(() => {
    // Restore original process.argv and env
    process.argv = originalArgv;
    process.env = originalEnv;
  });

  test('should execute correct Firebase commands to update config', () => {
    // Run the script (require will execute it)
    jest.isolateModules(() => {
      try {
        // This will throw because we're in a test environment, but we just want to verify the commands
        require('../../scripts/update-firebase-config');
      } catch (e) {
        // Expected to throw in test environment
      }
    });

    // Check that firebase use command was executed
    expect(execSync).toHaveBeenCalledWith(
      'firebase use development',
      expect.any(Object)
    );

    // Check that config commands were executed for each variable
    expect(execSync).toHaveBeenCalledWith(
      'firebase functions:config:set firebase.api_key="test-api-key"',
      expect.any(Object)
    );

    expect(execSync).toHaveBeenCalledWith(
      'firebase functions:config:set firebase.auth_domain="test-auth-domain.firebaseapp.com"',
      expect.any(Object)
    );

    expect(execSync).toHaveBeenCalledWith(
      'firebase functions:config:set firebase.project_id="test-project-id"',
      expect.any(Object)
    );

    // Check that config get was called to verify the update
    expect(execSync).toHaveBeenCalledWith(
      'firebase functions:config:get',
      expect.any(Object)
    );
  });

  test('should handle environment selection correctly', () => {
    // Set argv for production
    process.argv = ['node', 'update-firebase-config.js', '--env=prd', '--no-confirm'];

    jest.isolateModules(() => {
      try {
        require('../../scripts/update-firebase-config');
      } catch (e) {
        // Expected to throw in test environment
      }
    });

    // Check that firebase use command was executed with production
    expect(execSync).toHaveBeenCalledWith(
      'firebase use production',
      expect.any(Object)
    );
  });

  test('should use Firebase token in CI environment', () => {
    // Set up CI environment with token
    process.env.CI = 'true';
    process.env.FIREBASE_TOKEN = 'test-firebase-token';
    process.argv = ['node', 'update-firebase-config.js', '--env=dev', '--no-confirm'];

    jest.isolateModules(() => {
      try {
        require('../../scripts/update-firebase-config');
      } catch (e) {
        // Expected to throw in test environment
      }
    });

    // Check that commands include token
    expect(execSync).toHaveBeenCalledWith(
      'firebase use development --token test-firebase-token',
      expect.any(Object)
    );

    expect(execSync).toHaveBeenCalledWith(
      'firebase functions:config:set firebase.api_key="test-api-key" --token test-firebase-token',
      expect.any(Object)
    );
  });

  test('should detect CI environment from command line arg', () => {
    // Set CI via command line argument instead of env var
    process.argv = ['node', 'update-firebase-config.js', '--env=dev', '--ci', '--no-confirm'];
    process.env.FIREBASE_TOKEN = 'test-firebase-token';

    jest.isolateModules(() => {
      try {
        require('../../scripts/update-firebase-config');
      } catch (e) {
        // Expected to throw in test environment
      }
    });

    // Should skip Firebase authentication check in CI mode
    expect(execSync).not.toHaveBeenCalledWith(
      'firebase projects:list',
      expect.any(Object)
    );
  });

  test('should exit if .env file does not exist', () => {
    // Mock file does not exist
    fs.existsSync = jest.fn().mockReturnValue(false);

    // Mock process.exit
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });

    jest.isolateModules(() => {
      try {
        require('../../scripts/update-firebase-config');
      } catch (e) {
        // Expected
      }
    });

    // Should exit with error code
    expect(mockExit).toHaveBeenCalledWith(1);

    // Restore mock
    mockExit.mockRestore();
  });
}); 