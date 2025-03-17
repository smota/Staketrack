# StakeTrack - Stakeholder Management Application

StakeTrack is a comprehensive web application for managing stakeholder relationships, visualizing influence-impact metrics, and receiving AI-powered engagement recommendations.

## Features

- **Comprehensive Stakeholder Profiles**: Document stakeholders with detailed attributes including influence, impact, relationship quality, interests, and strategies.
- **Visual Influence-Impact Matrix**: Interactive quadrant map to visualize stakeholders based on their strategic importance.
- **Interaction Tracking**: Journal system to log and track stakeholder interactions over time.
- **AI-Powered Recommendations**: Get personalized advice for stakeholder engagement and next best actions.
- **Multi-Map Management**: Create and manage multiple stakeholder maps for different projects or initiatives.
- **Data Persistence**: Automatic saving to both browser storage and cloud (when authenticated).
- **Flexible Authentication**: Multiple sign-in options including anonymous mode.
- **Responsive Design**: Works on both desktop and mobile devices.

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase (Authentication, Firestore, Analytics)
- **AI Recommendations**: Anthropic Claude API
- **Deployment**: Firebase Hosting

## Documentation

StakeTrack comes with comprehensive documentation:

- [Service Setup Guide](docs/SETUP.md) - Instructions for setting up Firebase, Claude API, and other services
- [Configuration Guide](docs/CONFIGURATION.md) - How to configure environment variables and application settings
- [Deployment Guide](docs/DEPLOYMENT.md) - Instructions for deploying the application to Firebase
- [Run and Debug Guide](docs/RUN_DEBUG.md) - How to run and debug the application during development
- [Testing Guide](docs/TESTING.md) - Instructions for running tests and writing new ones
- [Specifications](docs/spec/README.md) - Detailed functional specifications in EPIC → FEATURE → STORY format

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/staketrack.git
cd staketrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up services following the [Service Setup Guide](docs/SETUP.md)

4. Configure the application following the [Configuration Guide](docs/CONFIGURATION.md)

5. Start the development server:
```bash
npm run dev
```

See the [Run and Debug Guide](docs/RUN_DEBUG.md) for more detailed instructions.

## Usage

1. **Sign in or continue anonymously**: Choose your preferred authentication method or use without signing in.
2. **Create a stakeholder map**: Start a new map for your project or initiative.
3. **Add stakeholders**: Document each stakeholder with their attributes and strategic importance.
4. **Visualize relationships**: Use the matrix view to understand stakeholder positioning.
5. **Log interactions**: Keep track of meetings, calls, and other interactions.
6. **Get recommendations**: Use AI recommendations for engagement strategies and next best actions.

## Folder Structure

```
staketrack/
├── assets/          # Static assets
│   ├── css/         # CSS styles and components
│   ├── images/      # App images
├── docs/            # Documentation
│   └── spec/        # Detailed specifications
├── firebase/        # Firebase configuration
├── js/              # JavaScript files
│   ├── components/  # UI components
│   ├── controllers/ # Controllers managing app logic
│   ├── models/      # Data models
│   ├── services/    # Services for data, auth, etc.
│   ├── utils/       # Utility functions
│   └── views/       # View components
├── scripts/         # Automation scripts
├── tests/           # Test files
├── .vscode/         # VS Code configuration
├── index.html       # Main HTML file
└── README.md        # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Firebase for authentication and data storage
- Anthropic for Claude API
- All contributors and supporters of the project
