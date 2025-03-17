# Firebase Configuration and Deployment

This document provides instructions for setting up and using the Firebase automation tools for both development (DEV) and production (PRD) environments.

## Setup

1. **Initialize Firebase Environment**:

   ```bash
   npm run firebase:setup
   ```

   This script will:
   - Create Firebase projects for DEV and PRD if they don't exist
   - Set up project aliases
   - Create necessary configuration files
   - Add deployment scripts to package.json

2. **Generate Service Account Keys** (for CI/CD):

   ```bash
   # For development environment
   node scripts/generate-service-account.js --env=DEV
   
   # For production environment
   node scripts/generate-service-account.js --env=PRD
   ```

3. **Set up Environment Variables**:

   Create `.env.development` and `.env.production` files with the necessary environment variables:

   ```
   ENVIRONMENT=DEV or PRD
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=12345
   FIREBASE_APP_ID=1:12345:web:abcdef
   FIREBASE_MEASUREMENT_ID=G-XXXXXXX
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ANTHROPIC_API_ENDPOINT=https://api.anthropic.com/v1/messages
   USE_EMULATORS=true or false (optional)
   ```

## Deployment

### Manual Deployment

1. **Deploy to Development**:

   ```bash
   # Deploy only hosting
   npm run deploy:dev
   
   # Deploy only firestore rules
   npm run deploy:rules:dev
   
   # Deploy everything
   npm run deploy:all:dev
   ```

2. **Deploy to Production**:

   ```bash
   # Deploy only hosting
   npm run deploy:prod
   
   # Deploy only firestore rules
   npm run deploy:rules:prod
   
   # Deploy everything
   npm run deploy:all:prod
   ```

3. **Custom Deployment**:

   ```bash
   # Format: node scripts/firebase-deploy.js --env=ENV --option=OPTION
   node scripts/firebase-deploy.js --env=DEV --option=functions
   node scripts/firebase-deploy.js --env=PRD --option=storage
   ```

   Available options:
   - `hosting`: Web app hosting
   - `firestore`: Firestore rules and indexes
   - `functions`: Cloud Functions
   - `storage`: Storage rules
   - `rules`: All rules (Firestore and Storage)
   - `all`: Everything

4. **Dry Run**:

   To see what commands would be executed without actually running them:

   ```bash
   node scripts/firebase-deploy.js --env=DEV --option=hosting --dry-run
   ```

5. **Skip Confirmation**:

   To skip the confirmation prompt:

   ```bash
   node scripts/firebase-deploy.js --env=DEV --option=hosting --no-confirm
   ```

### Automated Deployment via GitHub Actions

The repository includes GitHub Actions workflows that automatically deploy:

- To the DEV environment when pushing to the `development` branch
- To the PRD environment when pushing to the `main` branch

You can also manually trigger deployments through the GitHub Actions interface.

## Local Development with Emulators

Start Firebase emulators for local development:

```bash
npm run emulators
```

The emulators will be available at:
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Functions: http://localhost:5001
- Hosting: http://localhost:5000
- Storage: http://localhost:9199
- Emulator UI: http://localhost:4000

## Additional Commands

- **List Firebase Projects**:

  ```bash
  firebase projects:list
  ```

- **Check Current Project**:

  ```bash
  firebase use
  ```

- **Switch Projects**:

  ```bash
  firebase use development
  firebase use production
  ``` 