import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

interface ConfigResponse {
  environment: string;
  firebase: FirebaseConfig;
}

export const getConfig = functions.region('europe-west1').https.onRequest(async (request, response) => {
  // Enable CORS
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    const env = request.query.env?.toString().toLowerCase() || 'development';
    const isValidEnv = ['local', 'development', 'production'].includes(env);

    if (!isValidEnv) {
      response.status(400).json({ error: 'Invalid environment specified' });
      return;
    }

    // Get Firebase config from environment
    const config = functions.config();
    const envConfig = config[env] || {};

    // Build response object
    const configResponse: ConfigResponse = {
      environment: env.toUpperCase(),
      firebase: {
        apiKey: envConfig.firebase_api_key || process.env.FIREBASE_API_KEY || '',
        authDomain: envConfig.firebase_auth_domain || process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: envConfig.firebase_project_id || process.env.FIREBASE_PROJECT_ID || '',
        storageBucket: envConfig.firebase_storage_bucket || process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: envConfig.firebase_messaging_sender_id || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: envConfig.firebase_app_id || process.env.FIREBASE_APP_ID || '',
        measurementId: envConfig.firebase_measurement_id || process.env.FIREBASE_MEASUREMENT_ID || ''
      }
    };

    // Validate required fields
    const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
    const missingFields = requiredFields.filter(field => !configResponse.firebase[field]);

    if (missingFields.length > 0) {
      functions.logger.error('Missing required configuration fields:', missingFields);
      response.status(500).json({
        error: 'Incomplete configuration',
        missingFields
      });
      return;
    }

    // Log success (without sensitive values)
    functions.logger.info(`Configuration served for ${env} environment`, {
      environment: configResponse.environment,
      configFields: Object.keys(configResponse.firebase)
    });

    response.json(configResponse);
  } catch (error) {
    functions.logger.error('Error serving configuration:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
}); 