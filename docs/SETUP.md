# Service Setup Guide

This guide provides instructions for setting up the external services required for StakeTrack.

## Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Firebase CLI (`npm install -g firebase-tools`)

## Firebase Setup

StakeTrack uses Firebase for authentication, data storage, and hosting. Follow these steps to set up Firebase:

1. **Create Firebase Projects**

   You'll need to create two Firebase projects: one for development and one for production.

   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the wizard to create:
     - `staketrack-dev` for your development environment
     - `staketrack-prod` for your production environment

2. **Enable Firebase Services**

   For each project, enable the following services:

   - **Authentication**:
     - Go to Authentication > Sign-in method
     - Enable Email/Password
     - Enable Google Sign-in
     - Enable Microsoft Sign-in (optional)

   - **Firestore**:
     - Go to Firestore Database
     - Click "Create database"
     - Start in production mode
     - Choose a location closest to your primary users

   - **Storage**:
     - Go to Storage
     - Click "Get started"
     - Start in production mode
     - Choose the same location as your Firestore database

3. **Automated Setup**

   StakeTrack includes an automated setup script:

   ```bash
   npm run firebase:setup
   ```

   This script will:
   - Confirm your Firebase project IDs
   - Update `.firebaserc` with your project IDs
   - Initialize Firestore indexes
   - Create storage rules
   - Set up deployment scripts

## Anthropic Claude API Setup

StakeTrack uses Anthropic's Claude API for AI-powered recommendations:

1. **Get API Access**:
   - Sign up at [Anthropic API](https://www.anthropic.com/product)
   - Generate an API key from your dashboard

2. **Configure API Key**:
   - Update `.env.development` with your Anthropic API key:
     ```
     ANTHROPIC_API_KEY=your-anthropic-api-key
     ```
   - Update `.env.production` with the same API key for production

## GitHub Actions Setup

StakeTrack uses GitHub Actions for CI/CD. To set up GitHub Actions:

1. **Create GitHub Repository**:
   - Create a new GitHub repository or use an existing one
   - Push your StakeTrack code to the repository

2. **Configure GitHub Secrets**:
   
   Add the following secrets to your GitHub repository:
   
   - Go to your GitHub repository
   - Click on "Settings" → "Secrets and variables" → "Actions"
   - Click "New repository secret" and add each of these secrets:

   ```
   FIREBASE_TOKEN              # Firebase CI token from 'firebase login:ci'
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

3. **Generate Firebase Token**:
   
   For CI/CD deployments, you need a Firebase CI token:
   
   ```bash
   firebase login:ci
   ```
   
   Use the generated token as the `FIREBASE_TOKEN` secret in GitHub.

4. **Create Environment Settings**:
   
   Create separate environment settings for development and production:
   
   - Go to your GitHub repository
   - Click on "Settings" → "Environments"
   - Create "development" and "production" environments
   - Add environment-specific secrets if needed

5. **First Workflow Run**:
   
   The workflows will run automatically when you push to your repository. You can also run them manually:
   
   - Go to the "Actions" tab in your repository
   - Select the workflow you want to run
   - Click "Run workflow"
   - Select the branch and options
   - Click "Run workflow" again

## Other Dependencies

Install all project dependencies:

```bash
npm install
```

This will install:
- Development dependencies (webpack, babel, jest, etc.)
- Runtime dependencies (firebase, dotenv, etc.)

## Verify Setup

Test your setup by starting the development server and Firebase emulators:

```bash
npm run dev & npm run emulators
```

You should be able to access the application at `http://localhost:5000` with all services running locally. 

To verify GitHub Actions is set up correctly, make a small change and push it to your repository. The test workflow should run automatically. 