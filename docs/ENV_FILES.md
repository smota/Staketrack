# Environment Configuration Files

This document explains the environment configuration file structure used in the StakeTrack application.

## File Structure

We use a dual-file approach to separate sensitive and non-sensitive configuration:

| File Pattern | Purpose | Git Status |
|--------------|---------|------------|
| `.env.[environment]` | Non-sensitive configuration | Committed to git |
| `.env.[environment].local` | Sensitive data (API keys, secrets) | NOT committed (in .gitignore) |

Where `[environment]` is one of:
- `development` - Local development environment
- `staging` - Testing/QA environment
- `production` - Live production environment

## Example Files

We provide template files to help you get started:

- `.env.example` - Template for non-sensitive configuration (copy to `.env.[environment]`)
- `.env.local.example` - Template for sensitive configuration (copy to `.env.[environment].local`)

## Configuration Categories

### Non-Sensitive (in `.env.[environment]`)

- Feature flags
- Environment names and identifiers
- Emulator settings
- API endpoints (URLs only, not keys)
- Non-sensitive Firebase configuration
- UI configuration
- Rate limits
- Debug settings

### Sensitive (in `.env.[environment].local`)

- API keys (Firebase, external services)
- Authentication secrets
- JWT secrets
- Encryption keys
- Service account details
- Any credentials or tokens

## Environment Files Summary

| Environment | Non-Sensitive File | Sensitive File |
|-------------|-------------------|---------------|
| Development | `.env.development` | `.env.development.local` |
| Staging | `.env.staging` | `.env.staging.local` |
| Production | `.env.production` | `.env.production.local` |

## Usage in Code

All environment variables should be accessed via the centralized `config` object in `src/config/index.js`, not directly through `process.env`.

```javascript
// Good
import config from '@/config';
const apiUrl = config.env.apiUrl;
const isFeatureEnabled = config.features.someFeature;

// Bad
const apiUrl = process.env.APP_API_URL;
```

## Adding New Configuration

When adding new configuration:

1. Decide if it's sensitive or non-sensitive
2. Add it to the appropriate example file
3. Add it to your local environment files
4. Update the `config/index.js` file to include the new configuration
5. Use the standardized parsing methods in `config/index.js`:
   - `parseBooleanFlag()` for boolean flags
   - `parseArrayValue()` for comma-separated lists
   - Add specific defaults for all values 