# Run and Debug Guide

This guide provides instructions for running and debugging the StakeTrack application.

## Environment Types

StakeTrack supports three distinct environments:

1. **LOCAL**: For local development with Firebase emulators
   - Uses static config files from `/config/local.json`
   - Firebase emulators enabled
   - Intended for local development and testing

2. **DEV**: Online development environment
   - Uses environment variables via API endpoint
   - Connects to actual Firebase DEV project
   - No emulators used
   - For testing in a realistic but non-production environment

3. **PRD**: Production environment
   - Uses environment variables via API endpoint
   - Connects to actual Firebase PROD project
   - For the live application

## Running the Application

StakeTrack offers several options for running the application during development.

### Local Development with Emulators

To start the local development server with emulators:

```bash
# Start Firebase emulators
firebase emulators:start

# In a separate terminal, start the development server
npm run dev
```

This will:
- Load configuration from `config/local.json`
- Start webpack-dev-server in development mode
- Serve the application on `http://localhost:8081`
- Connect to local Firebase emulators
- Enable hot module replacement for instant updates

### Development Environment Testing

To test against the DEV environment:

```bash
npm run dev:online
```

This will:
- Load configuration from the DEV environment API endpoint
- Connect to the actual DEV Firebase project (not emulators)
- Start webpack-dev-server in development mode
- Serve the application on `http://localhost:8081`

### Production Build (Local Testing)

To test a production build locally with emulators:

```bash
npm run build
npm run serve
```

This will:
- Build the application with production settings
- Serve the built files using Firebase hosting emulator
- Connect to local Firebase emulators

### Firebase Emulators

For full-stack local development with Firebase services:

```bash
npm run emulators
```

This starts the Firebase emulators for:
- Hosting (port 5000)
- Authentication (port 9099)
- Firestore (port 8080)
- Storage (port 9199)
- Functions (port 5001)
- Emulator UI (port 4000)

Access the emulator UI at `http://localhost:4000` to monitor and interact with the emulated Firebase services.

## Configuration Setup

Before running the application, ensure you have the proper configuration files:

### Local Environment

Create or update `/config/local.json` with:

```json
{
  "ENVIRONMENT": "LOCAL",
  "FIREBASE_API_KEY": "your-dev-api-key",
  "FIREBASE_AUTH_DOMAIN": "localhost",
  "FIREBASE_PROJECT_ID": "your-dev-project",
  "FIREBASE_STORAGE_BUCKET": "your-dev-project.appspot.com",
  "FIREBASE_MESSAGING_SENDER_ID": "your-dev-sender-id",
  "FIREBASE_APP_ID": "your-dev-app-id",
  "FIREBASE_MEASUREMENT_ID": "your-dev-measurement-id",
  "USE_EMULATORS": "true"
}
```

### DEV and PRD Environments

For DEV and PRD environments, ensure your Firebase Functions are properly configured with environment variables:

```bash
# For DEV environment
firebase use dev
firebase functions:config:set firebase.api_key="your-dev-api-key" firebase.auth_domain="your-dev-project.firebaseapp.com" ...

# For PRD environment
firebase use prod
firebase functions:config:set firebase.api_key="your-prod-api-key" firebase.auth_domain="your-prod-project.firebaseapp.com" ...
```

## Debugging

StakeTrack includes VS Code launch configurations for debugging.

### VS Code Debugging

Open the project in VS Code and use the following debug configurations from the Run and Debug panel:

1. **Launch Chrome (Local Development)**:
   - Launches Chrome with the local development build
   - Automatically attaches the VS Code debugger
   - Allows setting breakpoints in source code
   - Connects to Firebase emulators

2. **Launch Chrome (DEV Environment)**:
   - Connects to the actual DEV Firebase project
   - Useful for testing with real Firebase services

3. **Launch Chrome (Production)**:
   - Similar to development, but with production build
   - Useful for testing production behavior

4. **Run Tests**:
   - Launches Jest test runner in debug mode
   - Enables debugging test cases
   - Shows test output in the integrated terminal

5. **Firebase Emulator**:
   - Starts Firebase emulators in debug mode
   - Allows debugging emulator interactions

6. **Dev Server + Firebase Emulator**:
   - Compound configuration that launches both the development server and Firebase emulators
   - Provides a complete local development environment

### Starting a Debugging Session

1. Set breakpoints in your code by clicking in the left margin of a source file
2. Select a debug configuration from the dropdown in the Run and Debug panel
3. Click the green "Play" button or press F5
4. When a breakpoint is hit, execution will pause and you can:
   - Examine variable values in the Variables panel
   - Use the Debug Console to evaluate expressions
   - Step through code execution using the debug toolbar

### Browser DevTools Integration

The VS Code debugger integrates with Chrome DevTools:

- Source maps are properly configured for both development and production builds
- Breakpoints can be set in either VS Code or Chrome DevTools
- Console logs from the application appear in both VS Code Debug Console and Chrome DevTools

## Common Tasks

StakeTrack includes VS Code tasks for common development operations:

- **Start Local Server**: Starts the local development server with emulators
- **Start DEV Server**: Connects to DEV environment Firebase project
- **Start Prod Server**: Builds and serves the production version
- **Run Tests**: Executes the test suite
- **Start Firebase Emulators**: Starts the Firebase emulators

Access these tasks from the VS Code command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) by typing "Tasks: Run Task".

## Troubleshooting

### Development Server Issues

If the development server fails to start:
- Check that the required ports (8081, etc.) are not in use
- Verify your configuration files in `/config` directory
- Check for syntax errors in your most recent code changes

### Environment Configuration Issues

If the application fails to load Firebase configuration:
- For LOCAL: Check that `/config/local.json` exists and is properly formatted
- For DEV/PRD: Verify the API endpoint is accessible and returns valid JSON
- Check browser console for specific error messages

### Firebase Emulator Issues

If Firebase emulators fail to start:
- Verify you have the latest Firebase CLI installed
- Check that required ports are available
- Ensure `firebase.json` has the correct emulator configuration 