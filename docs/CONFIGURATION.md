# Configuration Guide

This guide covers how to configure StakeTrack for your environment.

## Environment Variables

StakeTrack uses environment variables for configuration. There are two types of environment files:

- `.env.[environment]` - Contains **non-sensitive** configuration, committed to git
- `.env.[environment].local` - Contains **sensitive** configuration like API keys, NOT committed to git

### Secret Management

**Important**: Never store secrets or API keys in the main environment files (`.env.development`, `.env.staging`, `.env.production`) as these are committed to the repository.

Instead:
- Store all sensitive values in `.env.[environment].local` files
- These files are in `.gitignore` and won't be committed to the repository
- Each developer needs to create these files locally
- For CI/CD, the build process uses GitHub Secrets instead

### Development Environment

The non-sensitive configuration in `.env.development` should contain:

```
NODE_ENV=development
APP_VERSION=1.0.0
APP_ENVIRONMENT=DEVELOPMENT
APP_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
APP_FIREBASE_PROJECT_ID=your-dev-project
APP_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
APP_FIREBASE_FUNCTIONS_REGION=europe-west1
APP_USE_EMULATORS=true
APP_EMULATOR_AUTH_PORT=9099
APP_EMULATOR_FIRESTORE_PORT=8080
APP_EMULATOR_FUNCTIONS_PORT=5001
```

The sensitive configuration in `.env.development.local` should contain:

```
# IMPORTANT: Never commit this file to git!
APP_FIREBASE_API_KEY=your-dev-api-key
APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
APP_FIREBASE_APP_ID=your-app-id
APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Production Environment

The non-sensitive configuration in `.env.production` should contain:

```
NODE_ENV=production
APP_VERSION=1.0.0
APP_ENVIRONMENT=PRODUCTION
APP_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
APP_FIREBASE_PROJECT_ID=your-prod-project
APP_FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
APP_FIREBASE_FUNCTIONS_REGION=europe-west1
APP_USE_EMULATORS=false
```

The sensitive configuration in `.env.production.local` should contain:

```
# IMPORTANT: Never commit this file to git!
APP_FIREBASE_API_KEY=your-prod-api-key
APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
APP_FIREBASE_APP_ID=your-app-id
APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Environment Validation

StakeTrack includes an automated environment validation workflow in GitHub Actions (`env-validate.yml`) that checks:

- Required environment variables are present
- Firebase configuration files are valid
- Hosting targets are properly configured

This workflow runs automatically when:
- Environment files (.env.*) are changed
- Firebase configuration files are modified
- Can be manually triggered from GitHub Actions

If the validation fails, it indicates that your environment configuration needs attention before deployment.

## Runtime Configuration Loading

In production environments, StakeTrack uses a secure approach to load configuration:

1. The application calls the Firebase Function `getConfig` to retrieve configuration
2. This function securely provides necessary configuration from Firebase environment variables
3. The application never directly accesses sensitive values from client-side code
4. If the API call fails, a fallback mechanism with minimal configuration is used

For local development, the values from `.env.development` and `.env.development.local` are used directly.

## GitHub Actions Secrets

For CI/CD workflows to function properly, add the following secrets to your GitHub repository:

```
FIREBASE_TOKEN              # Firebase CI token
FIREBASE_PROJECT_ID         # Firebase project ID (dev or prod depending on environment)
FIREBASE_API_KEY            # Firebase API key
FIREBASE_AUTH_DOMAIN        # Firebase auth domain
FIREBASE_STORAGE_BUCKET     # Firebase storage bucket
FIREBASE_MESSAGING_SENDER_ID # Firebase messaging sender ID
FIREBASE_APP_ID             # Firebase app ID
FIREBASE_MEASUREMENT_ID     # Firebase measurement ID
ANTHROPIC_API_KEY           # Anthropic API key
ANTHROPIC_API_ENDPOINT      # Anthropic API endpoint
```

To add these secrets:
1. Go to your GitHub repository
2. Click on "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret" and add each secret

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

### Firebase Functions

The Firebase Function `getConfig` provides runtime configuration securely:

1. It retrieves sensitive values from Firebase environment variables 
2. These values are set using `firebase functions:config:set` command
3. The function never exposes hard-coded secret values

To update Firebase Functions config:

```bash
# For development environment
firebase use development
firebase functions:config:set \
  firebase.api_key="YOUR_DEV_API_KEY" \
  firebase.auth_domain="YOUR_DEV_AUTH_DOMAIN" \
  # Add other configuration as needed

# For production environment
firebase use production
firebase functions:config:set \
  firebase.api_key="YOUR_PROD_API_KEY" \
  firebase.auth_domain="YOUR_PROD_AUTH_DOMAIN" \
  # Add other configuration as needed
```

## Build Configuration

### Webpack Configuration

The webpack configuration determines how your application is bundled:

- Development build: `npm run build:dev`
- Production build: `npm run build:prod`

These commands use the corresponding environment variables from both `.env.[environment]` and `.env.[environment].local` files.

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