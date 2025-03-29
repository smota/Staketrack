# Secure Firebase Configuration Guide

This document explains how to securely handle Firebase configuration in the StakeTrack application.

## Overview

Instead of hard-coding Firebase credentials in your client-side code, this application uses a secure approach to load environment variables at runtime. This approach provides several benefits:

- Prevents exposure of API keys in client-side source code
- Allows for environment-specific configurations (local, development, production)
- Enables dynamic updates to configuration without redeploying the application
- Follows security best practices for handling sensitive credentials

## How It Works

The application uses different methods to load configuration depending on the environment:

1. **LOCAL Environment**: Uses static configuration files for local development with emulators
2. **DEV Environment**: Uses environment variables via secure API endpoint for online development environment
3. **PRD Environment**: Uses environment variables via secure API endpoint for production environment

## Environment Types

StakeTrack supports three distinct environments:

1. **LOCAL**: For local development with Firebase emulators
   - Uses static config files from `/config/local.json`
   - Firebase emulators enabled
   - Intended for local development only

2. **DEV**: Online development environment
   - Uses environment variables via API endpoint
   - Connects to actual Firebase DEV project
   - No emulators used
   - For testing in a realistic but non-production environment

3. **PRD**: Production environment
   - Uses environment variables via API endpoint
   - Connects to actual Firebase PROD project
   - For the live application

## Setup Instructions

### For Local Development with Emulators

1. Create a `config` directory at your project root
2. Create a `local.json` file in the `config` directory with your development credentials:

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

3. Start the Firebase emulators:

```bash
firebase emulators:start
```

4. Run the application locally:

```bash
npm run dev
```

### For Development Environment (DEV)

1. Deploy the Cloud Function in `functions/getConfig.js` to your dev Firebase project
2. Set environment variables in your Firebase Functions environment:

```bash
firebase use dev
firebase functions:config:set firebase.api_key="your-dev-api-key" firebase.auth_domain="your-dev-project.firebaseapp.com" ...
```

3. The application will load configuration from the API endpoint when deployed to the DEV environment

### For Production Environment (PRD)

1. Deploy the Cloud Function in `functions/getConfig.js` to your production Firebase project
2. Set environment variables in your Firebase Functions environment:

```bash
firebase use prod
firebase functions:config:set firebase.api_key="your-prod-api-key" firebase.auth_domain="your-prod-project.firebaseapp.com" ...
```

3. The application will load configuration from the API endpoint when deployed to the PRD environment

### Fallback Mechanism

The application includes a robust fallback mechanism:

1. First tries to load from the appropriate source (static file for LOCAL, API for DEV/PRD)
2. If API fails in DEV/PRD, tries to load from static files as a fallback
3. If all else fails, uses hardcoded values as a last resort

This ensures the application can still function even if there are configuration loading issues.

### Automatic Configuration Deployment

The project now includes a script to automatically update Firebase Functions configuration from your local `.env` files:

1. Ensure your `.env.development` and `.env.production` files contain all the required Firebase configuration variables
2. Run the update script directly:

   ```bash
   npm run firebase:update-config:dev  # For development environment
   npm run firebase:update-config:prod  # For production environment
   ```

3. Or deploy with automatic configuration update:

   ```bash
   npm run deploy:all:dev  # Deploys everything to development with config update
   npm run deploy:all:prod  # Deploys everything to production with config update
   ```

This automation ensures that your Firebase Functions configuration stays in sync with your local environment settings.

**Security Note**: Be careful not to commit your actual `.env` files to version control. They should always be added to `.gitignore`.

### Firebase Functions Configuration

Firebase Functions requires a specific setup before you can use the configuration commands. We've added a convenient initialization script:

1. **Initialize Firebase Functions**:

   ```bash
   npm run firebase:init-functions:dev   # For development environment
   npm run firebase:init-functions:prod  # For production environment
   ```

   This will:
   - Create the necessary Functions directory structure
   - Set up basic Function files (index.js, package.json)
   - Configure the getConfig.js function for secure configuration

2. **Update Firebase Functions Configuration**:

   After initialization, you can update the configuration:

   ```bash
   npm run firebase:update-config:dev   # Update development config
   npm run firebase:update-config:prod  # Update production config
   ```

3. **Deploy Firebase Functions**:

   ```bash
   npm run deploy:functions:dev   # Deploy functions to development
   npm run deploy:functions:prod  # Deploy functions to production
   ```

### GitHub Actions Deployment

The project includes GitHub Actions workflows that automatically deploy your application and update Firebase configuration securely:

1. **Configure GitHub Secrets**:
   
   In your GitHub repository, go to Settings > Secrets and variables > Actions, and add the following secrets:

   - `FIREBASE_TOKEN`: A Firebase CI token (generate with `firebase login:ci`)
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_API_KEY`: Your Firebase API key
   - `FIREBASE_AUTH_DOMAIN`: Your Firebase Auth domain
   - `FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
   - `FIREBASE_APP_ID`: Your Firebase app ID
   - `FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID
   - `ANTHROPIC_API_KEY`: Your Anthropic API key (if used)
   - `ANTHROPIC_API_ENDPOINT`: Your Anthropic API endpoint (if used)

2. **Environment-Specific Secrets**:
   
   For additional security, create separate GitHub environments (e.g., "development" and "production") with their own secrets:

   1. Go to Settings > Environments
   2. Create two environments: `development` and `production`
   3. Add the appropriate environment-specific secrets to each

3. **Workflow Execution**:

   The GitHub workflow automatically:
   - Creates `.env` files from GitHub secrets
   - Updates Firebase Functions configuration
   - Builds and deploys the application

4. **Triggering Deployments**:

   Deployments are triggered when:
   - Code is pushed to the `development` branch (deploys to development environment)
   - Code is pushed to the `main` branch (deploys to production environment)
   - Manually triggered using the GitHub Actions workflow dispatch feature

## Environment Variables

The following environment variables are required:

| Variable | Description |
|----------|-------------|
| FIREBASE_API_KEY | Firebase API key |
| FIREBASE_AUTH_DOMAIN | Firebase Auth domain |
| FIREBASE_PROJECT_ID | Firebase project ID |
| FIREBASE_STORAGE_BUCKET | Firebase storage bucket |
| FIREBASE_MESSAGING_SENDER_ID | Firebase messaging sender ID |
| FIREBASE_APP_ID | Firebase app ID |
| FIREBASE_MEASUREMENT_ID | Firebase measurement ID (for Analytics) |
| USE_EMULATORS | Whether to use Firebase emulators (only true for LOCAL environment) |

## Security Considerations

- **Never commit** real API keys or credentials to your code repository
- Use environment-specific keys (different keys for local, development, production)
- Configure proper access controls on your Firebase Cloud Function
- Consider implementing additional security measures:
  - Rate limiting
  - IP whitelisting
  - JWT authentication for the configuration endpoint
  - CORS restrictions to limit which domains can access the configuration

## Testing

To ensure the secure configuration loading works properly:

1. Test local development setup with emulators using `/config/local.json`
2. Test DEV environment with the deployed DEV Cloud Function
3. Test PRD environment with the deployed PRD Cloud Function
4. Verify Firebase services initialize correctly in each environment
5. Test the fallback mechanism for when configuration fails to load 

## AI Configuration

The StakeTrack application uses a serverless AI implementation with the following configuration:

### Prompt Templates

The AI functionality uses server-side prompt templates for security and flexibility:

1. **Template Files**:
   - `functions/src/config/promptTemplates.default.js` - Default templates
   - `functions/src/config/promptTemplates.production.js` - Production-specific templates
   - `functions/src/config/promptTemplates.development.js` - Development-specific templates

2. **Environment Selection**:
   The system selects the appropriate template file based on the `NODE_ENV` environment variable:
   ```javascript
   // Get environment from environment variable or default to local
   const ENV = process.env.NODE_ENV || 'local'
   ```

3. **Template Structure**:
   Each template file exports:
   ```javascript
   module.exports = {
     templates: {
       // Template definitions
       stakeholderRecommendationsJSON: { ... },
       stakeholderAdvice: { ... },
       // etc.
     },
     modelConfigs: {
       // Model parameter configurations
       default: { ... },
       analytical: { ... },
       // etc.
     },
     safetySettings: [
       // Safety filter settings
     ]
   }
   ```

### AI Environment Variables

The AI functionality is configured using these environment variables:

```
# Basic AI configuration
APP_AI_ENABLED=true              # Enable/disable AI features
APP_AI_MODEL=gemini-1.5-pro      # Default AI model to use
APP_AI_WEEKLY_LIMIT=10           # Default user weekly request limit
APP_AI_ADMIN_LIMIT=100           # Default admin weekly request limit

# Firebase Functions Config (set via firebase functions:config:set)
firebase functions:config:set ai.enabled=true ai.model="gemini-1.5-pro" ai.weekly_limit=10
```

### Cloud Functions Configuration

The Cloud Functions for AI use the following secure deployment process:

1. **Configuration Update**:
   ```bash
   npm run firebase:update-config:dev   # For development environment
   npm run firebase:update-config:prod  # For production environment
   ```

2. **Prompt Template Deployment**:
   ```bash
   npm run deploy:development
   # or
   npm run deploy:production
   ```

3. **Testing Configuration**:
   You can test the current configuration with:
   ```bash
   firebase functions:config:get
   ``` 