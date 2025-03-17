# Testing Guide

StakeTrack uses Jest for testing. This guide provides instructions for running and writing tests.

## Running Tests

### Running All Tests

To run all tests:

```bash
npm test
```

This will:
- Run all test files with the `.test.js` extension
- Generate a coverage report
- Display test results in the console

### Watch Mode

For development, you can run tests in watch mode, which automatically reruns tests when files change:

```bash
npm run test:watch
```

### Running Specific Tests

To run specific tests:

```bash
# Run tests matching a pattern
npm test -- -t "auth"

# Run a specific test file
npm test -- tests/app.test.js
```

## Continuous Integration

StakeTrack includes GitHub Actions workflows that automatically run tests on each push and pull request:

### GitHub Actions Test Workflow

The test workflow is defined in `.github/workflows/test.yml` and:

- Runs on every push to `main` and `development` branches
- Runs on every pull request to `main` and `development` branches
- Can be manually triggered with environment selection
- Tests both development and production environments in parallel
- Uploads test coverage to Codecov

#### Test Workflow Configuration

The test workflow:

1. Checks out the repository code
2. Sets up Node.js environment
3. Installs dependencies
4. Creates environment-specific configuration files
5. Runs tests for both development and production configurations
6. Uploads coverage reports with environment-specific flags

#### Manually Triggering Tests

To manually trigger the test workflow:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Test" workflow
4. Click "Run workflow"
5. Choose the environment (DEV or PRD)
6. Click "Run workflow"

### Environment Validation

The `env-validate.yml` workflow validates environment configurations for both development and production:

- Validates environment variables
- Checks Firebase configuration files
- Ensures proper targets are set up for each environment

## Test Structure

StakeTrack tests are organized into the following categories:

### Unit Tests

Located in the `tests` directory, mirroring the structure of the `js` directory:

- `tests/models/` - Tests for data models
- `tests/controllers/` - Tests for controllers
- `tests/views/` - Tests for view components
- `tests/components/` - Tests for UI components
- `tests/services/` - Tests for services

### Integration Tests

Integration tests are in the root of the `tests` directory with the `.integration.test.js` suffix:

- `tests/app.integration.test.js` - Application integration tests
- `tests/stakeholder.integration.test.js` - Stakeholder feature integration tests
- `tests/auth.integration.test.js` - Authentication integration tests

## Test Setup

The test environment is configured in several files:

- `jest.config.js` - Main Jest configuration
- `tests/setup.js` - Test environment setup, including DOM mocking
- `babel.config.js` - Babel configuration for transpiling test files

### Mock Data

Mock data for testing is located in `tests/mocks/`:

- `tests/mocks/stakeholders.js` - Mock stakeholder data
- `tests/mocks/users.js` - Mock user data
- `tests/mocks/firebase.js` - Firebase service mocks

## Writing Tests

### Basic Test Structure

```javascript
import { functionToTest } from '../js/path/to/module';

describe('Module or function name', () => {
  beforeEach(() => {
    // Setup for each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should do something specific', () => {
    // Arrange
    const input = 'some input';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Testing Components

StakeTrack uses DOM testing for components:

```javascript
import { renderComponent } from '../js/path/to/component';

describe('Component', () => {
  test('should render correctly', () => {
    // Arrange
    document.body.innerHTML = '<div id="container"></div>';
    const container = document.getElementById('container');
    const data = { /* mock data */ };
    
    // Act
    renderComponent(container, data);
    
    // Assert
    expect(container.querySelector('.component-class')).not.toBeNull();
    expect(container.textContent).toContain('Expected text');
  });
});
```

### Testing Firebase Interactions

Firebase services are mocked in `tests/setup.js`:

```javascript
import { saveData } from '../js/path/to/module';
import { firestore } from '../firebase/firebaseConfig';

// The mock is already set up in tests/setup.js
describe('Firebase interactions', () => {
  test('should save data to Firestore', async () => {
    // Arrange
    const data = { id: '123', name: 'Test' };
    
    // Act
    await saveData(data);
    
    // Assert
    expect(firestore.collection).toHaveBeenCalledWith('collectionName');
    expect(firestore.collection().doc).toHaveBeenCalledWith('123');
    expect(firestore.collection().doc().set).toHaveBeenCalledWith(data);
  });
});
```

## Code Coverage

StakeTrack is configured to generate code coverage reports. After running tests, you can view the coverage report in the `coverage` directory:

```bash
# Run tests with coverage
npm test

# Open the coverage report
open coverage/lcov-report/index.html
```

The coverage report shows:
- Line coverage: Percentage of code lines executed during tests
- Function coverage: Percentage of functions called during tests
- Branch coverage: Percentage of code branches (if/else, etc.) executed during tests
- Statement coverage: Percentage of code statements executed during tests

### Coverage in CI

The GitHub Actions workflow uploads coverage reports to Codecov:

- Each environment (development/production) has its own coverage report
- Coverage reports are tagged with environment flags for filtering
- Pull requests display coverage changes and comparisons

## Best Practices

When writing tests for StakeTrack, follow these best practices:

1. **Test in Isolation**: Mock external dependencies to isolate the code being tested
2. **Test One Thing at a Time**: Each test should verify a single behavior or feature
3. **Use Descriptive Test Names**: Test names should clearly describe what is being tested
4. **Follow AAA Pattern**: Arrange (setup), Act (execute), Assert (verify)
5. **Keep Tests Fast**: Tests should run quickly to provide immediate feedback
6. **Test Edge Cases**: Include tests for boundary conditions and error handling
7. **Maintain Test Independence**: Tests should not depend on other tests or their order
8. **Keep CI Green**: Always keep the CI test workflow passing on main and development branches

## Troubleshooting

### Common Issues

- **Tests timing out**: If tests are timing out, check for asynchronous operations that aren't being properly awaited
- **Mock not working**: Verify that the mock is properly set up and the correct module is being imported
- **DOM errors**: Ensure the DOM structure is properly set up in the test or in `tests/setup.js` 