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