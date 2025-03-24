import type { Analytics } from '@firebase/analytics';
import { getAnalytics } from '@firebase/analytics';
import type { FirebaseApp } from '@firebase/app';
import { initializeApp } from '@firebase/app';
import type { Auth } from '@firebase/auth';
import { getAuth } from '@firebase/auth';
import type { Firestore } from '@firebase/firestore';
import { getFirestore } from '@firebase/firestore';

export type Environment = 'LOCAL' | 'DEV' | 'PRD';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

interface Config {
  environment: Environment;
  isEmulator: boolean;
  firebase: FirebaseConfig;
  api: {
    baseUrl: string;
    endpoints: {
      config: string;
    };
  };
}

class ConfigService {
  private static instance: ConfigService;
  private config: Config | null = null;
  private firebaseApp: FirebaseApp | null = null;
  private firebaseAuth: Auth | null = null;
  private firebaseFirestore: Firestore | null = null;
  private firebaseAnalytics: Analytics | null = null;

  private constructor() { }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Load configuration based on environment
      await this.loadConfig();

      // Initialize Firebase even for non-logged in users (for analytics)
      await this.initializeFirebase();

      // Dispatch initialization event
      window.dispatchEvent(new CustomEvent('config:initialized'));
    } catch (error) {
      console.error('Failed to initialize configuration:', error);
      window.dispatchEvent(new CustomEvent('config:error', { detail: error }));
    }
  }

  private async loadConfig(): Promise<void> {
    const environment = this.determineEnvironment();
    const isEmulator = environment === 'LOCAL';

    try {
      // Try to load config from API first
      const config = await this.fetchConfigFromApi(environment);
      this.config = {
        environment,
        isEmulator,
        firebase: config.firebase,
        api: {
          baseUrl: this.getApiBaseUrl(environment),
          endpoints: {
            config: '/api/config'
          }
        }
      };
    } catch (error) {
      console.warn('Failed to load config from API, using fallback:', error);
      this.config = this.getFallbackConfig(environment);
    }
  }

  private determineEnvironment(): Environment {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'LOCAL';
    } else if (hostname.includes('staketrack-dev')) {
      return 'DEV';
    }
    return 'PRD';
  }

  private async fetchConfigFromApi(environment: Environment): Promise<any> {
    const baseUrl = this.getApiBaseUrl(environment);
    const response = await fetch(`${baseUrl}/api/config?env=${environment.toLowerCase()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }
    return response.json();
  }

  private getApiBaseUrl(environment: Environment): string {
    const baseUrls = {
      LOCAL: 'http://localhost:5000',
      DEV: 'https://staketrack-dev.web.app',
      PRD: 'https://staketrack.web.app'
    };
    return baseUrls[environment];
  }

  private getFallbackConfig(environment: Environment): Config {
    return {
      environment,
      isEmulator: environment === 'LOCAL',
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
      },
      api: {
        baseUrl: this.getApiBaseUrl(environment),
        endpoints: {
          config: '/api/config'
        }
      }
    };
  }

  private async initializeFirebase(): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    // Initialize Firebase app
    this.firebaseApp = initializeApp(this.config.firebase);

    // Initialize Firebase services
    this.firebaseAuth = getAuth(this.firebaseApp);
    this.firebaseFirestore = getFirestore(this.firebaseApp);

    // Initialize Analytics for all users (even when not logged in)
    if (this.config.environment === 'PRD') {
      this.firebaseAnalytics = getAnalytics(this.firebaseApp);
    }

    // Set up emulators for local development
    if (this.config.isEmulator) {
      const { connectAuthEmulator } = await import('firebase/auth');
      const { connectFirestoreEmulator } = await import('firebase/firestore');

      connectAuthEmulator(this.firebaseAuth, 'http://localhost:9099');
      connectFirestoreEmulator(this.firebaseFirestore, 'localhost', 8080);
    }
  }

  // Public getters
  public getEnvironment(): Environment {
    return this.config?.environment || 'PRD';
  }

  public isEmulatorEnabled(): boolean {
    return this.config?.isEmulator || false;
  }

  public getFirebaseApp(): FirebaseApp {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return this.firebaseApp;
  }

  public getFirebaseAuth(): Auth {
    if (!this.firebaseAuth) {
      throw new Error('Firebase Auth not initialized');
    }
    return this.firebaseAuth;
  }

  public getFirebaseFirestore(): Firestore {
    if (!this.firebaseFirestore) {
      throw new Error('Firebase Firestore not initialized');
    }
    return this.firebaseFirestore;
  }

  public getFirebaseAnalytics(): Analytics | null {
    return this.firebaseAnalytics;
  }

  public getApiBaseUrl(): string {
    return this.config?.api.baseUrl || '';
  }
}

export const configService = ConfigService.getInstance(); 