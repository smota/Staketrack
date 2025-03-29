# Prompt Templates Configuration

This directory contains the prompt templates used for AI functionality in StakeTrack.

## File Structure

- `promptTemplates.js` - Main entry point that selects and loads the appropriate template file
- `promptTemplates.default.js` - Default templates used as fallback
- `promptTemplates.production.js` - Production-specific templates
- `promptTemplates.development.js` - Development-specific templates (create as needed)
- `promptTemplates.local.js` - Local development templates (create as needed)

## How It Works

The system selects the appropriate template file based on the `NODE_ENV` environment variable:

```javascript
// Get environment from environment variable or default to local
const ENV = process.env.NODE_ENV || 'local'
```

If the environment-specific file is not found, it falls back to the default templates.

## Template Structure

Each template file exports:

```javascript
module.exports = {
  templates: {
    // Template definitions for different functions
    stakeholderRecommendationsJSON: { 
      instruction: "System instruction to the model...",
      contextPattern: "Context with ${placeholders} for data...",
      outputFormat: "Expected output format...",
      modelConfig: "default" // references a config from modelConfigs
    },
    stakeholderAdvice: { /* ... */ },
    // More templates...
  },
  
  modelConfigs: {
    // Model parameter configurations for different use cases
    default: {
      model: 'gemini-1.5-pro',
      temperature: 0.7,
      maxOutputTokens: 1500,
      topK: 40,
      topP: 0.8
    },
    analytical: { /* ... */ },
    // More configs...
  },
  
  safetySettings: [
    // Safety filter settings
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    // More safety settings...
  ]
}
```

## Creating Environment-Specific Templates

To create an environment-specific template:

1. Copy `promptTemplates.default.js` to `promptTemplates.[environment].js`
2. Modify the templates, model configs, or safety settings as needed
3. The system will automatically use your environment-specific templates when the `NODE_ENV` matches

## Deployment

Use the deployment script to automatically select the right template:

```bash
node deploy-prompts.js [environment]
```

Where `[environment]` is one of: `production`, `development`, or `local`.

Or use the npm scripts:

```bash
npm run deploy:production
npm run deploy:development
npm run deploy:local
``` 