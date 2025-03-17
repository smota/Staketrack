# Run and Debug Guide

This guide provides instructions for running and debugging the StakeTrack application.

## Running the Application

StakeTrack offers several options for running the application during development.

### Development Server

To start the development server with hot-reloading:

```bash
npm run dev
```

This will:
- Load configuration from `.env.development`
- Start webpack-dev-server in development mode
- Serve the application on `http://localhost:5000`
- Enable hot module replacement for instant updates

### Production Build (Local)

To test a production build locally:

```bash
npm run build
npm run serve
```

This will:
- Build the application with production settings
- Serve the built files using Firebase hosting emulator

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

## Debugging

StakeTrack includes VS Code launch configurations for debugging.

### VS Code Debugging

Open the project in VS Code and use the following debug configurations from the Run and Debug panel:

1. **Launch Chrome (Development)**:
   - Launches Chrome with the development build
   - Automatically attaches the VS Code debugger
   - Allows setting breakpoints in source code
   - Runs the development server as a pre-launch task

2. **Launch Chrome (Production)**:
   - Similar to development, but with production build
   - Useful for testing production behavior

3. **Run Tests**:
   - Launches Jest test runner in debug mode
   - Enables debugging test cases
   - Shows test output in the integrated terminal

4. **Firebase Emulator**:
   - Starts Firebase emulators in debug mode
   - Allows debugging emulator interactions

5. **Dev Server + Firebase Emulator**:
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

- **Start Dev Server**: Starts the development server
- **Start Prod Server**: Builds and serves the production version
- **Run Tests**: Executes the test suite
- **Start Firebase Emulators**: Starts the Firebase emulators

Access these tasks from the VS Code command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) by typing "Tasks: Run Task".

## Troubleshooting

### Development Server Issues

If the development server fails to start:
- Check that the required ports (5000, etc.) are not in use
- Verify your environment variables in `.env.development`
- Check for syntax errors in your most recent code changes

### Debugging Connection Issues

If the debugger fails to connect:
- Ensure Chrome is started with remote debugging enabled
- Check if another debugging session is already connected
- Verify source maps are generated correctly

### Firebase Emulator Issues

If Firebase emulators fail to start:
- Verify you have the latest Firebase CLI installed
- Check that required ports are available
- Ensure `firebase.json` has the correct emulator configuration 