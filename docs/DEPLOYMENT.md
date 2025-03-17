# Deployment Guide

StakeTrack includes built-in deployment automation for Firebase. This guide will walk you through the deployment process.

## Prerequisites

Before deploying, ensure you have:

1. Set up Firebase projects (see [Setup Guide](SETUP.md))
2. Configured environment variables (see [Configuration Guide](CONFIGURATION.md))
3. Installed all dependencies (`npm install`)
4. Logged in to Firebase CLI (`firebase login`)

## Deployment Script

StakeTrack includes a powerful deployment script (`scripts/firebase-deploy.js`) that supports:

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

## Deployment Options

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
   - Update version in package.json if needed
   - Run tests (`npm test`)

3. **Production Deployment**:
   ```bash
   # Deploy to production
   npm run deploy:all:prod
   ```

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

## Troubleshooting

If you encounter issues during deployment:

1. Check the Firebase CLI output for specific errors
2. Verify your `.firebaserc` file has the correct project IDs
3. Ensure you're logged in to the Firebase account with access to the projects
4. Check if your Firebase plan supports all required features (Blaze plan required for some features) 