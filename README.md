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
VUE_APP_FIREBASE_API_KEY=your-dev-api-key
VUE_APP_FIREBASE_AUTH_DOMAIN=your-project-dev.firebaseapp.com
VUE_APP_FIREBASE_PROJECT_ID=your-project-dev
VUE_APP_FIREBASE_STORAGE_BUCKET=your-project-dev.appspot.com
VUE_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VUE_APP_FIREBASE_APP_ID=your-app-id
VUE_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
VUE_APP_ANTHROPIC_API_KEY=your-anthropic-api-key
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

## License

This project is licensed under the MIT License.
