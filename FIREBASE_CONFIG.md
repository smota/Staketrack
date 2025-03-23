# Secure Firebase Configuration Guide

This document explains how to securely handle Firebase configuration in the StakeTrack application.

## Overview

Instead of hard-coding Firebase credentials in your client-side code, this application uses a secure approach to load environment variables at runtime. This approach provides several benefits:

- Prevents exposure of API keys in client-side source code
- Allows for environment-specific configurations (development, staging, production)
- Enables dynamic updates to configuration without redeploying the application
- Follows security best practices for handling sensitive credentials

## How It Works

1. The client application makes a request to a secure endpoint
2. The secure endpoint (Firebase Cloud Function) returns the appropriate configuration
3. The configuration is loaded into the application's memory at runtime
4. Firebase is initialized with the securely loaded configuration

## Setup Instructions

### For Local Development

1. Create a `config` directory at your project root
2. Create a `dev.json` file in the `config` directory with your development credentials:

```json
{
  "ENVIRONMENT": "DEV",
  "FIREBASE_API_KEY": "your-dev-api-key",
  "FIREBASE_AUTH_DOMAIN": "your-dev-project.firebaseapp.com",
  "FIREBASE_PROJECT_ID": "your-dev-project",
  "FIREBASE_STORAGE_BUCKET": "your-dev-project.appspot.com",
  "FIREBASE_MESSAGING_SENDER_ID": "your-dev-sender-id",
  "FIREBASE_APP_ID": "your-dev-app-id",
  "FIREBASE_MEASUREMENT_ID": "your-dev-measurement-id",
  "USE_EMULATORS": "true"
}
```

3. For local development, the application will load configuration from `/config/dev.json`

### For Production Deployment

1. Deploy the Cloud Function in `functions/getConfig.js` to your Firebase project
2. Set environment variables in your Firebase Functions environment:

```bash
firebase functions:config:set firebase.api_key="your-api-key" firebase.auth_domain="your-project.firebaseapp.com" ...
```

Or use the Firebase console to set these environment variables.

3. Update the URLs in `js/utils/environmentLoader.js` to point to your deployed Cloud Function

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
| USE_EMULATORS | Whether to use Firebase emulators (true/false) |

## Security Considerations

- **Never commit** real API keys or credentials to your code repository
- Use environment-specific keys (different keys for development, staging, production)
- Configure proper access controls on your Firebase Cloud Function
- Consider implementing additional security measures:
  - Rate limiting
  - IP whitelisting
  - JWT authentication for the configuration endpoint
  - CORS restrictions to limit which domains can access the configuration

## Testing

To ensure the secure configuration loading works properly:

1. Test local development setup with `/config/dev.json`
2. Test production configuration with the deployed Cloud Function
3. Verify Firebase services initialize correctly in each environment
4. Test the fallback mechanism for when configuration fails to load 