# StakeTrack - Vue.js Edition

A comprehensive web application for managing stakeholder relationships, visualizing influence-impact metrics, and receiving AI-powered engagement recommendations.

## Technology Stack

- **Frontend**: Vue.js 3, Vuetify 3 (Material Design)
- **Backend**: Firebase (Authentication, Firestore, Analytics)
- **AI Recommendations**: Anthropic Claude API
- **Deployment**: Firebase Hosting
- **Testing**: Jest (Unit), Playwright (E2E)
- **Linting**: ESLint with Vue.js plugin
- **Environment Management**: Cross-env for cross-platform compatibility

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

# Build for staging
npm run build:staging
```

All build commands use cross-env to ensure consistent environment variables across platforms.

### Deployment

The application supports deployment to three environments: development, staging, and production.

```bash
# Deploy to Firebase staging environment
npm run deploy:staging

# Deploy to Firebase development environment
npm run deploy:dev

# Deploy to Firebase production environment
npm run deploy:prod

# Deploy functions to development environment
npm run firebase:deploy:functions:dev

# Deploy functions to production environment
npm run firebase:deploy:functions:prod
```

#### Enhanced Staging Deployment

The staging deployment process includes special features:
- Automatic validation of required Firebase configuration
- Merging of environment variables from .env.staging and .env.staging.local
- Error handling and deployment logs

To use with dry run (no actual deployment):
```bash
node scripts/deploy-staging.js --dry-run
```

Refer to the [Deployment Guide](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
staketrack/
├── .firebase/             # Firebase cache directory
├── .github/               # GitHub configuration files
├── .husky/                # Git hooks configuration
├── .vscode/               # VS Code configuration
├── assets/                # Static assets
├── config/                # Configuration files
├── coverage/              # Test coverage reports
├── dist/                  # Production build output
├── docs/                  # Documentation
├── firebase/              # Firebase configuration
├── functions/             # Firebase Cloud Functions
├── js/                    # JavaScript files
├── node_modules/          # Node.js dependencies
├── playwright-report/     # Playwright test reports
├── scripts/               # Utility scripts
├── src/                   # Source code
│   ├── components/        # Vue components
│   ├── config/            # Application configuration
│   ├── firebase/          # Firebase integration
│   ├── models/            # Data models
│   ├── router/            # Vue Router configuration
│   ├── services/          # Services for API, auth, etc.
│   ├── stores/            # Global state management (Pinia)
│   ├── styles/            # Global CSS
│   ├── utils/             # Utility functions
│   ├── views/             # Page components
│   ├── App.vue            # Root component
│   └── main.js            # Entry point
├── tests/                 # Tests
│   ├── e2e/               # End-to-end tests
│   └── unit/              # Unit tests
├── .babelrc               # Babel configuration
├── .env.development       # Development environment variables (non-secret)
├── .env.production        # Production environment variables (non-secret)
├── .env.staging           # Staging environment variables (non-secret)
├── .env.development.local # Local dev secrets (gitignored)
├── .env.staging.local     # Staging secrets (gitignored)
├── .env.production.local  # Production secrets (gitignored)
├── .env.local.example     # Example environment variables file
├── .eslintrc.js           # ESLint configuration
├── babel.config.js        # Babel configuration
├── firebase.json          # Firebase configuration
├── index.html             # HTML entry point
├── jest.config.js         # Jest configuration
├── package.json           # Project dependencies and scripts
├── playwright.config.js   # Playwright configuration
├── vue.config.js          # Vue configuration
└── webpack.config.js      # Webpack configuration
```

## Secret Management

- **Local Development**: Uses `.env.development.local` (gitignored)
- **Production**: Secrets are stored in Firebase Functions environment variables
- **CI/CD**: Secrets are stored in GitHub Actions secrets

## Environment Setup

The application uses environment variables for configuration with a clear separation between sensitive and non-sensitive values:

- **Non-sensitive values** are stored in `.env.[environment]` files (committed to Git)
  - `APP_FIREBASE_AUTH_DOMAIN`
  - `APP_FIREBASE_PROJECT_ID`
  - `APP_FIREBASE_STORAGE_BUCKET`
  - `APP_FIREBASE_FUNCTIONS_REGION`
  - Other non-sensitive configuration

- **Sensitive values** are stored in `.env.[environment].local` files (not committed to Git)
  - `APP_FIREBASE_API_KEY`
  - `APP_FIREBASE_MESSAGING_SENDER_ID`
  - `APP_FIREBASE_APP_ID`
  - `APP_FIREBASE_MEASUREMENT_ID`
  - API keys and secrets

See `.env.example` and `.env.local.example` for reference templates.

## License

This project is licensed under the MIT License.

## Documentation

Comprehensive documentation is available in the `docs` directory:

- [Setup Guide](docs/SETUP.md) - Getting started with the project
- [Configuration Guide](docs/CONFIGURATION.md) - Environment configuration
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment to various environments
- [Firebase Configuration](docs/FIREBASE_CONFIG.md) - Firebase-specific setup
- [Testing Guide](docs/TESTING.md) - Running and writing tests
- [AI Features](docs/spec/EPIC-05-AI-Recommendations.md) - AI recommendation functionality

### AI Features

StakeTrack includes AI-powered recommendation features that use server-side prompt templates:

- **Stakeholder Engagement Advice**: Personalized recommendations for engaging with specific stakeholders
- **Next Best Action Recommendations**: Prioritized action suggestions based on stakeholder data
- **Influence Network Analysis**: AI-driven analysis of stakeholder relationships
- **Issue-Specific Recommendations**: Topic-focused engagement strategies

See [AI Recommendations Documentation](docs/spec/EPIC-05-AI-Recommendations.md) for details on implementation and usage.

## Firebase Service Integration

StakeTrack uses Firebase services with v2 API compatibility. All Firebase functionality is configured to use the `europe-west1` region as required by project guidelines.

### Firebase Configuration Guidelines

- All Firebase functions are implemented using v2 API
- All services are configured to use `europe-west1` region
- Proper error logging and monitoring is implemented for service failures
- Rate limiting is implemented for all API endpoints
- Cross-origin resource sharing (CORS) is properly configured

### Environment Configuration

The application supports three environments:

- **DEVELOPMENT**: Local environment running on emulators
- **STAGING**: Online Firebase application used for testing (`staketrack-dev`)
- **PRODUCTION**: Online Firebase application for public use (`staketrack`)

Environment-specific configuration is handled through `.env.[environment]` files, with sensitive data stored in `.env.[environment].local` files (not committed to git).

## Important Project Rules

1. **Firebase Services**
   - All client code and functions use v2 API compatibility
   - All services are configured for the `europe-west1` region
   - Proper error logging when services aren't working as expected

2. **Environment Management**
   - No environment-specific code (configuration-based environment handling)
   - No environment-specific failovers
   - STAGING environment is `staketrack-dev`
   - PRODUCTION environment is `staketrack`
   - DEVELOPMENT environment uses local emulators

3. **Configuration Management**
   - Sensitive keys are stored in `.env.[environment].local` files
   - Non-sensitive keys are stored in `.env.[environment]` files
   - Environment files have consistent structure across environments
