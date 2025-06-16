# Deployment Guide

StakeTrack includes built-in deployment automation for Firebase. This guide will walk you through the deployment process.

## Prerequisites

Before deploying, ensure you have:

1. Set up Firebase projects (see [Setup Guide](SETUP.md))
2. Configured environment variables (see [Configuration Guide](CONFIGURATION.md))
3. Installed all dependencies (`npm install`)
4. Logged in to Firebase CLI (`firebase login`)
5. Global installation of cross-env (`npm install -g cross-env`) for environment variable management

## Environment Variables Management

StakeTrack uses cross-env to manage environment variables consistently across platforms (Windows, macOS, Linux). This ensures:

- Proper setting of NODE_ENV and other environment variables
- Cross-platform compatibility for all build and deployment scripts
- Seamless merging of environment variables from multiple sources
- Consistent behavior in local development and CI/CD environments

### Environment Files

StakeTrack uses several environment files:

- `.env.development` - Development environment variables (committed to git)
- `.env.staging` - Staging environment variables (committed to git)
- `.env.production` - Production environment variables (committed to git)
- `.env.*.local` - Local overrides containing sensitive data (not committed to git)

During deployment, environment variables from these files are loaded and passed to the build process.

## Deployment Options

### GitHub Actions Automated Deployment

StakeTrack includes GitHub Actions workflows for automated deployments:

- Pushes to the `development` branch automatically deploy to the development environment
- Pushes to the `main` branch automatically deploy to the production environment
- Manual deployment can be triggered from the GitHub Actions interface

#### GitHub Actions Configuration

The deployment workflow is defined in `.github/workflows/firebase-deploy.yml` and supports:

- Environment-specific deployments (DEV/PRD)
- Component-specific deployments (hosting, firestore, functions, etc.)
- Manual triggering with deployment options

To manually trigger a deployment:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Firebase Deployment" workflow
4. Click "Run workflow"
5. Choose:
   - Environment: DEV or PRD
   - Deployment Option: hosting, firestore, functions, storage, rules, or all
6. Click "Run workflow"

#### GitHub Secrets Configuration

The GitHub Actions workflow requires the following secrets to be configured in your repository:

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

## Local Deployment Scripts

StakeTrack includes powerful local deployment scripts that support different environments and deployment options.

### Main Deployment Script

The main deployment script (`scripts/firebase-deploy.js`) supports:

- Multiple environments (development and production)
- Selective deployment of components (hosting, Firestore rules, etc.)
- Dry-run mode for testing deployments
- Confirmation prompts for safety

### Staging Deployment Script

A dedicated staging deployment script (`scripts/deploy-staging.js`) is available for staging deployments with enhanced features:

- Automatic validation of required Firebase configuration
- Seamless merging of environment variables from `.env.staging` and `.env.staging.local`
- Streamlined deployment process specific to the staging environment
- Error handling and detailed logs for troubleshooting

To use the staging deployment script:

```bash
# Deploy to staging environment
npm run deploy:staging

# Deploy to staging environment with dry run (no actual deployment)
node scripts/deploy-staging.js --dry-run
```

## Deployment Commands

The following npm scripts are available for deployment:

### Environment-Specific Deployment

Deploy to specific environments:

```bash
# Deploy to staging environment
npm run deploy:staging

# Deploy to development environment
npm run deploy:dev

# Deploy to production environment
npm run deploy:prod
```

### Hosting Only Deployment

Deploy only the web application hosting:

```bash
# Deploy to development environment
npm run deploy:dev

# Deploy to production environment
npm run deploy:prod
```

### Rules Deployment

Deploy only the Firestore and Storage rules:

```bash
# Deploy rules to development environment
npm run deploy:rules:dev

# Deploy rules to production environment
npm run deploy:rules:prod
```

### Full Deployment

Deploy everything (hosting, rules, etc.):

```bash
# Deploy all to development environment
npm run deploy:all:dev

# Deploy all to production environment
npm run deploy:all:prod
```

## Local Deployment Options

The deployment script supports additional command-line options:

```bash
node scripts/firebase-deploy.js --env=DEV --option=hosting
```

### Environment Options

- `--env=DEV` - Deploy to development environment
- `--env=PRD` - Deploy to production environment

### Component Options

- `--option=hosting` - Deploy only hosting
- `--option=firestore` - Deploy only Firestore rules and indexes
- `--option=functions` - Deploy only Firebase Functions
- `--option=storage` - Deploy only Storage rules
- `--option=rules` - Deploy all rules (Firestore and Storage)
- `--option=all` - Deploy everything (default)

### Additional Options

- `--dry-run` - Simulate deployment without making changes
- `--no-confirm` - Skip confirmation prompts

## Building with Cross-env

All build scripts use cross-env to ensure consistent environment variable setting across platforms:

```bash
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build:prod
```

Under the hood, these commands use cross-env to set the NODE_ENV and other variables:

```bash
cross-env NODE_ENV=production vue-cli-service build --mode staging
```

This ensures that:
- Environment variables are correctly set regardless of platform
- Vue CLI builds with the correct configuration
- Environment-specific settings are applied consistently

## Example Deployment Workflow

A typical deployment workflow might look like this:

1. **Development Testing**:
   ```bash
   # Deploy to development for testing
   npm run deploy:all:dev
   ```

2. **Staging Validation**:
   ```bash
   # Deploy to staging for QA and testing
   npm run deploy:staging
   ```

3. **Production Preparation**:
   - Ensure all changes are committed
   - Create a pull request to merge into main
   - Ensure tests pass in GitHub Actions workflow
   - Update version in package.json if needed

4. **Production Deployment**:
   - Merge the pull request to main (triggers automatic deployment)
   - Or manually trigger deployment from GitHub Actions

## VS Code Integration

StakeTrack includes VS Code tasks for deployment:

- `Deploy to Firebase (Development)` - Deploy hosting to development
- `Deploy to Firebase (Production)` - Deploy hosting to production
- `Deploy to Firebase (Staging)` - Deploy hosting to staging

You can access these from the VS Code command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) by typing "Tasks: Run Task".

## Deployment Infrastructure

The deployment automation uses:

- Firebase Hosting for web application deployment
- Firebase Firestore for database rules and indexes
- Firebase Storage for file storage rules
- GitHub Actions for CI/CD

## Environment Validation

StakeTrack includes a GitHub Actions workflow (`env-validate.yml`) that validates environment configurations to prevent deployment issues:

- Validates environment variables
- Checks Firebase configuration files
- Ensures proper targets are set up for each environment

## AI Features Deployment

### AI Configuration

AI functionality uses Firebase Vertex AI with Gemini models, configured with environment variables:

```
APP_AI_MODEL=gemini-1.5-pro
APP_AI_ENABLED=true
APP_AI_WEEKLY_LIMIT=10
```

No additional API keys are needed as Firebase service accounts handle the authentication.

### Prompt Templates Deployment

The system uses environment-specific prompt templates:

1. Deploy with prompt template configuration:
   ```bash
   # Deploy to development with development templates
   npm run deploy:development
   
   # Deploy to production with production templates
   npm run deploy:production
   
   # Deploy for local testing
   npm run deploy:local
   ```

2. The deployment process:
   - Selects appropriate prompt template file based on environment
   - Sets the NODE_ENV variable for functions environment
   
3. The `deploy-prompts.js` script:
   - Automatically manages prompt templates during deployment
   - Copies environment-specific template files to the correct location
   - Usage: `node functions/deploy-prompts.js [environment]`
   - Supported environments: `production`, `development`, `local`
   - Creates a `.env` file with the correct NODE_ENV setting

### AI Functions

Deploy Cloud Functions for AI features:

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific AI functions
firebase deploy --only functions:generateStakeholderRecommendations
```

## Troubleshooting

If you encounter issues during deployment:

1. Check the GitHub Actions workflow logs for specific errors
2. Check the Firebase CLI output for specific errors
3. Verify your `.firebaserc` file has the correct project IDs
4. Ensure you're logged in to the Firebase account with access to the projects
5. Check if your Firebase plan supports all required features (Blaze plan required for some features)
6. For environment variable issues:
   - Check that cross-env is installed globally (`npm install -g cross-env`)
   - Verify that .env files have the required variables
   - For staging deployments, ensure APP_FIREBASE_API_KEY, APP_FIREBASE_AUTH_DOMAIN and APP_FIREBASE_PROJECT_ID are set 