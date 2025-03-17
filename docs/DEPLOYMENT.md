# Deployment Guide

StakeTrack includes built-in deployment automation for Firebase. This guide will walk you through the deployment process.

## Prerequisites

Before deploying, ensure you have:

1. Set up Firebase projects (see [Setup Guide](SETUP.md))
2. Configured environment variables (see [Configuration Guide](CONFIGURATION.md))
3. Installed all dependencies (`npm install`)
4. Logged in to Firebase CLI (`firebase login`)

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

## Local Deployment Script

StakeTrack also includes a powerful local deployment script (`scripts/firebase-deploy.js`) that supports:

- Multiple environments (development and production)
- Selective deployment of components (hosting, Firestore rules, etc.)
- Dry-run mode for testing deployments
- Confirmation prompts for safety

## Deployment Commands

The following npm scripts are available for deployment:

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

## Example Deployment Workflow

A typical deployment workflow might look like this:

1. **Development Testing**:
   ```bash
   # Deploy to development for testing
   npm run deploy:all:dev
   ```

2. **Production Preparation**:
   - Ensure all changes are committed
   - Create a pull request to merge into main
   - Ensure tests pass in GitHub Actions workflow
   - Update version in package.json if needed

3. **Production Deployment**:
   - Merge the pull request to main (triggers automatic deployment)
   - Or manually trigger deployment from GitHub Actions

## VS Code Integration

StakeTrack includes VS Code tasks for deployment:

- `Deploy to Firebase (Development)` - Deploy hosting to development
- `Deploy to Firebase (Production)` - Deploy hosting to production

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

## Troubleshooting

If you encounter issues during deployment:

1. Check the GitHub Actions workflow logs for specific errors
2. Check the Firebase CLI output for specific errors
3. Verify your `.firebaserc` file has the correct project IDs
4. Ensure you're logged in to the Firebase account with access to the projects
5. Check if your Firebase plan supports all required features (Blaze plan required for some features) 