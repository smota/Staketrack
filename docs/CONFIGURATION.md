# Configuration Guide

This guide covers how to configure StakeTrack for your environment.

## Environment Variables

StakeTrack uses environment variables for configuration. There are two sets of environment variables:

- `.env.development` - Used for local development
- `.env.production` - Used for production builds

### Development Environment

The `.env.development` file should contain:

```
ENVIRONMENT=DEV
FIREBASE_API_KEY=your-dev-api-key
FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-dev-project
FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_API_ENDPOINT=https://api.anthropic.com/v1/messages
```

### Production Environment

The `.env.production` file should contain the same variables but configured for your production environment:

```
ENVIRONMENT=PRD
FIREBASE_API_KEY=your-prod-api-key
FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-prod-project
FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_API_ENDPOINT=https://api.anthropic.com/v1/messages
```

## Firebase Configuration

### Firebase Projects Configuration

The `.firebaserc` file defines your Firebase project configurations:

```json
{
  "projects": {
    "default": "staketrack-dev",
    "development": "staketrack-dev",
    "production": "staketrack-prod"
  },
  "targets": {
    "staketrack-dev": {
      "hosting": {
        "development": [
          "staketrack-dev"
        ]
      }
    },
    "staketrack-prod": {
      "hosting": {
        "production": [
          "staketrack-prod"
        ]
      }
    }
  }
}
```

### Firebase Rules

Firestore security rules are defined in `firebase/firestore.rules.ts`. Review and modify these rules according to your security requirements.

### Firebase Web SDK Configuration

Update `firebase/firebaseConfig.js` with your Firebase project details. The configuration is automatically populated with values from your environment variables.

## Build Configuration

### Webpack Configuration

The webpack configuration determines how your application is bundled:

- Development build: `npm run build:dev`
- Production build: `npm run build:prod`

These commands use the corresponding environment variables from `.env.development` or `.env.production`.

## Application Configuration

### Theme and Styling

- CSS files in the `assets/css` directory control the application's appearance
- Modify these files to customize the look and feel

### Application Settings

Application-specific settings can be found in `js/config.js`, including:

- Default stakeholder categories
- Matrix visualization settings
- Authentication options
- AI recommendation settings

## Advanced Configuration

### Firebase Emulators

Configure Firebase emulators in `firebase.json`:

```json
"emulators": {
  "auth": {
    "port": 9099
  },
  "functions": {
    "port": 5001
  },
  "firestore": {
    "port": 8080
  },
  "hosting": {
    "port": 5000
  },
  "storage": {
    "port": 9199
  },
  "ui": {
    "enabled": true,
    "port": 4000
  }
}
```

### VS Code Configuration

The project includes VS Code configuration for tasks and launch settings in the `.vscode` directory:

- `launch.json` - Debug configurations
- `tasks.json` - Common tasks
- `settings.json` - Editor settings

These files don't typically need modification unless you want to customize your development workflow. 