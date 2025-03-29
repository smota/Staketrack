# StakeTrack Deployment Guide

This guide outlines the deployment process for the StakeTrack application across development, staging, and production environments.

## Environments

StakeTrack uses three distinct environments:

1. **Development (DEV)**: Local development environment with emulators
2. **Staging (STG)**: Cloud-based testing environment that mirrors production
3. **Production (PRD)**: Live production environment

## Firebase Projects

Each environment corresponds to a Firebase project:

- **Development**: Uses local emulators with `staketrack-dev` project
- **Staging**: `staketrack-dev` project
- **Production**: `staketrack-prod` project

## Prerequisites

Ensure you have the following installed:

- Node.js 14+ and npm 7+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase login: `firebase login`

## Configuration Files

StakeTrack uses environment-specific configuration files:

- `.env.development` / `.env.development.local` - Development settings
- `.env.staging` / `.env.staging.local` - Staging settings
- `.env.production` / `.env.production.local` - Production settings

Never commit `.local` files to version control as they contain sensitive information.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Firebase emulators:
   ```bash
   firebase emulators:start
   ```

3. Start development server:
   ```bash
   npm run serve
   ```

## Deployment Process

### Staging Deployment

1. Build the application for staging:
   ```bash
   npm run build:staging
   ```

2. Deploy to Firebase staging project:
   ```bash
   firebase use staging
   firebase deploy
   ```

### Production Deployment

1. Build the application for production:
   ```bash
   npm run build:production
   ```

2. Deploy to Firebase production project:
   ```bash
   firebase use production
   firebase deploy
   ```

## Cloud Functions

When deploying Cloud Functions, you have the option to deploy all functions or specific ones:

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy a specific function
firebase deploy --only functions:generateStakeholderRecommendations
```

## Environment Variables

### Firebase Configuration

Each environment requires the following Firebase configuration:

```
APP_FIREBASE_API_KEY=...
APP_FIREBASE_AUTH_DOMAIN=...
APP_FIREBASE_PROJECT_ID=...
APP_FIREBASE_STORAGE_BUCKET=...
APP_FIREBASE_MESSAGING_SENDER_ID=...
APP_FIREBASE_APP_ID=...
APP_FIREBASE_MEASUREMENT_ID=...
APP_FIREBASE_FUNCTIONS_REGION=europe-west1
```

### AI Configuration

AI functionality uses Firebase Vertex AI with Gemini models, configured with:

```
APP_AI_MODEL=gemini-1.5-pro
APP_AI_ENABLED=true
APP_AI_WEEKLY_LIMIT=10
```

No additional API keys are needed as Firebase service accounts handle the authentication.

## Database Rules

Deploy Firestore security rules with:

```bash
firebase deploy --only firestore:rules
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure that your Firebase configuration keys are correct in the `.env.*.local` files.

2. **Functions Deployment Failures**: Check logs with `firebase functions:log` to diagnose the issue.

3. **AI Features Not Working**: Verify that your service account has access to Vertex AI services and that the Gemini API is enabled in your Google Cloud project.

### Monitoring

Monitor application health and performance using Firebase Console:

- **Hosting**: Check deployment status and traffic
- **Functions**: Review function execution and errors
- **Authentication**: Monitor user sign-ups and login activity
- **Firestore**: Track database performance and usage

## Admin Access

Admins are users with the `isAdmin: true` property in their Firestore user document. This can be set manually via the Firebase Console or using a dedicated admin management tool.

Admins have access to:
- User management
- System settings
- AI usage limit configuration

## Restoring Previous Versions

To roll back to a previous version:

```bash
firebase hosting:clone PROJECT_ID:SITE_ID PROJECT_ID:SITE_ID:RELEASE_ID
```

You can view available versions with:

```bash
firebase hosting:versions:list
``` 