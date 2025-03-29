# StakeTrack - Vue.js Edition

A comprehensive web application for managing stakeholder relationships, visualizing influence-impact metrics, and receiving AI-powered engagement recommendations.

## Technology Stack

- **Frontend**: Vue.js 3, Vuetify 3 (Material Design)
- **Backend**: Firebase (Authentication, Firestore, Analytics)
- **AI Recommendations**: Anthropic Claude API
- **Deployment**: Firebase Hosting
- **Testing**: Jest (Unit), Playwright (E2E)
- **Linting**: ESLint with Vue.js plugin

## Features

- **Comprehensive Stakeholder Profiles**: Document stakeholders with detailed attributes including influence, impact, relationship quality, interests, and strategies.
- **Visual Influence-Impact Matrix**: Interactive quadrant map to visualize stakeholders based on their strategic importance.
- **Interaction Tracking**: Journal system to log and track stakeholder interactions over time.
- **AI-Powered Recommendations**: Get personalized advice for stakeholder engagement and next best actions.
- **Multi-Map Management**: Create and manage multiple stakeholder maps for different projects or initiatives.
- **Data Persistence**: Automatic saving to both browser storage and cloud (when authenticated).
- **Flexible Authentication**: Multiple sign-in options including anonymous mode.
- **Responsive Design**: Works on both desktop and mobile devices.

## Project Setup

### Prerequisites

- Node.js (v18+)
- npm (v8+)
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

```bash
# Install dependencies
npm install

# Setup Firebase emulators (optional, for local development)
npm run firebase:emulators
```

### Environment Configuration

Create `.env.development.local` and `.env.production.local` files for your environment-specific secrets:

```
# .env.development.local example
APP_FIREBASE_API_KEY=your-dev-api-key
APP_FIREBASE_AUTH_DOMAIN=your-project-dev.firebaseapp.com
APP_FIREBASE_PROJECT_ID=your-project-dev
APP_FIREBASE_STORAGE_BUCKET=your-project-dev.appspot.com
APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
APP_FIREBASE_APP_ID=your-app-id
APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
APP_ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Development

```bash
# Serve with hot-reload at localhost:8080
npm run serve

# Start Firebase emulators
npm run firebase:emulators
```

### Testing

```bash
# Run unit tests
npm run test:unit

# Run E2E tests with Playwright
npm run test:e2e

# Run both unit and E2E tests
npm run test
```

### Linting

```bash
# Lint and fix files
npm run lint
```

### Building for Production

```bash
# Build for production
npm run build

# Build for development
npm run build:dev
```

### Deployment

```bash
# Deploy to Firebase development environment
npm run firebase:deploy:dev

# Deploy to Firebase production environment
npm run firebase:deploy:prod

# Deploy functions to development environment
npm run firebase:deploy:functions:dev

# Deploy functions to production environment
npm run firebase:deploy:functions:prod
```

## Project Structure

```
staketrack-vue/
├── public/                # Static assets
├── src/                   # Source code
│   ├── assets/            # Assets (images, fonts, etc.)
│   ├── components/        # Vue components
│   ├── config/            # Configuration
│   ├── models/            # Data models
│   ├── plugins/           # Vue plugins
│   ├── router/            # Vue Router configuration
│   ├── services/          # Services for API, auth, etc.
│   ├── store/             # Global state management
│   ├── styles/            # Global CSS
│   ├── utils/             # Utility functions
│   ├── views/             # Page components
│   ├── App.vue            # Root component
│   └── main.js            # Entry point
├── functions/             # Firebase Cloud Functions
├── tests/                 # Tests
│   ├── e2e/               # End-to-end tests
│   └── unit/              # Unit tests
├── .env.development       # Development environment variables (non-secret)
├── .env.production        # Production environment variables (non-secret)
├── .env.development.local # Local dev secrets (gitignored)
├── .eslintrc.js           # ESLint configuration
├── babel.config.js        # Babel configuration
├── firebase.json          # Firebase configuration
├── package.json           # Project dependencies and scripts
└── README.md              # Project documentation
```

## Secret Management

- **Local Development**: Uses `.env.development.local` (gitignored)
- **Production**: Secrets are stored in Firebase Functions environment variables
- **CI/CD**: Secrets are stored in GitHub Actions secrets

## Environment Setup

The application uses environment variables for configuration. Follow these steps to set up your development environment:

### 1. Environment Files Structure

The project uses the following environment files:

- `.env.local.example` - Template file with placeholder values (committed to git)
- `.env.development` - Development environment configuration (committed to git)
- `.env.staging` - Staging environment configuration (committed to git)
- `.env.development.local` - Local development secrets (not committed)
- `.env.staging.local` - Staging environment secrets (not committed)
- `.env.production.local` - Production environment secrets (not committed)

### 2. Setting Up Local Development

1. Copy the example file to create your local environment:
   ```bash
   cp .env.local.example .env.development.local
   ```

2. Update `.env.development.local` with your actual values:
   - Get Firebase configuration from your Firebase Console
   - Add your Anthropic API key
   - Keep other values as they are for local development

3. The application will automatically use the correct environment based on:
   - The hostname (localhost, staging, or production)
   - The presence of `.env.[environment].local` files

### 3. Environment Variables

Key environment variables:

- `APP_ENVIRONMENT`: Current environment (DEV, STAGING, PRD)
- `APP_USE_EMULATORS`: Enable/disable Firebase emulators
- `APP_ENABLE_ANALYTICS`: Enable/disable analytics
- `APP_API_BASE_URL`: Base URL for API endpoints
- Firebase configuration variables (API keys, project IDs, etc.)
- External service API keys

### 4. Security Notes

- Never commit `.env.*.local` files containing real secrets
- Keep your API keys and secrets secure
- Use different API keys for development and production
- The application uses Firebase Functions to securely provide configuration

### 5. Troubleshooting

If you encounter environment-related issues:

1. Check that your `.env.development.local` file exists and has all required variables
2. Verify that the Firebase emulators are running if using local development
3. Check the browser console for environment loading errors
4. Ensure you're using the correct Firebase project configuration

## License

This project is licensed under the MIT License.
