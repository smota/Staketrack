# Configuration and Secret Management

This document explains how StakeTrack manages configuration and secrets across different environments.

## Overview

StakeTrack uses a secure, centralized approach to configuration and secret management with the following key features:

- Environment-specific configuration via `.env` files
- Secure runtime configuration loading via Firebase Cloud Functions
- Firebase configuration management for both development and production
- Analytics enabled for all users (even when not logged in)
- Fallback mechanisms for configuration loading
- Local development support with Firebase emulators

## Environment Types

The application supports three environments:

1. **LOCAL**: For local development
   - Uses Firebase emulators
   - Configuration loaded from `.env.local`
   - Suitable for development and testing

2. **DEV**: Development environment
   - Uses development Firebase project
   - Configuration loaded securely via Cloud Function
   - For testing in a realistic environment

3. **PRD**: Production environment
   - Uses production Firebase project
   - Configuration loaded securely via Cloud Function
   - For live application

## Configuration Files

### Environment Files

Create the following files in your project root (never commit these to version control):

1. `.env.local`:
```
ENVIRONMENT=LOCAL
FIREBASE_API_KEY=your-dev-api-key
FIREBASE_AUTH_DOMAIN=localhost
FIREBASE_PROJECT_ID=your-dev-project
FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
USE_EMULATORS=true
```

2. `.env.development`:
```
ENVIRONMENT=DEV
FIREBASE_API_KEY=your-dev-api-key
FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-dev-project
FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

3. `.env.production`:
```
ENVIRONMENT=PRD
FIREBASE_API_KEY=your-prod-api-key
FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-prod-project
FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Secret Management

Secrets are managed using the following hierarchy:

1. **Development Secrets**:
   - Stored in Firebase Functions configuration
   - Updated via `manage-config.ts` script
   - Never committed to version control

2. **Production Secrets**:
   - Stored in Firebase Functions configuration
   - Updated via `manage-config.ts` script
   - Never committed to version control

3. **CI/CD Secrets**:
   - Stored in GitHub Actions secrets
   - Used for automated deployments
   - Separate secrets for DEV and PRD environments

## Configuration Loading Process

1. **Client-Side**:
   - `ConfigService` singleton manages configuration
   - Attempts to load config from API endpoint
   - Falls back to environment variables if API fails
   - Initializes Firebase services (including analytics)

2. **Server-Side**:
   - Cloud Function serves environment-specific configuration
   - Validates configuration before serving
   - Logs configuration access (without sensitive values)

## Managing Configuration

### Local Development

1. Create necessary `.env` files
2. Start Firebase emulators:
```bash
firebase emulators:start
```

### Updating Firebase Configuration

Use the `manage-config.ts` script:

```bash
# Update development configuration
npm run config:update development

# Update production configuration
npm run config:update production
```

### CI/CD Configuration

1. Set up GitHub Actions secrets:
   - `FIREBASE_TOKEN`
   - Environment-specific secrets for DEV and PRD

2. Configuration is automatically updated during deployment

## Analytics

Firebase Analytics is:
- Enabled for all users (even when not logged in)
- Only active in production environment
- Configured via environment variables

## Security Considerations

1. **Never commit secrets** to version control
2. Use different API keys for each environment
3. Restrict Cloud Function access appropriately
4. Use environment-specific Firebase projects
5. Enable security rules for Firestore
6. Monitor configuration access logs

## Troubleshooting

If configuration fails to load:
1. Check environment files exist and are valid
2. Verify Firebase Functions configuration
3. Check Cloud Function logs for errors
4. Verify environment detection is working
5. Check network requests in browser console 