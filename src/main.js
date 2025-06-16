import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './styles/main.css'
import { app as firebaseApp, auth, db, analytics, getFunctionsInstance, getFirebaseStorage } from './firebase'
import config from './config'
import { onAuthStateChanged } from 'firebase/auth'
import { checkFirebaseReadiness } from '@/utils/firebaseValidator'
import { validateAppConfig } from '@/utils/configValidator'

// Run configuration validation before initializing the app
const configValidation = validateAppConfig()

// Log validation results (without exposing sensitive information)
if (!configValidation.isValid) {
  console.warn('Application configuration issues detected:', configValidation.issues)
  console.warn('Some features may be limited or unavailable')
} else if (configValidation.skipped) {
  console.log('Configuration validation skipped by configuration setting')
}

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107'
        }
      }
    }
  }
})

// Create and mount app
const app = createApp(App)
app.use(router)
app.use(vuetify)
app.config.globalProperties.$config = config
app.config.globalProperties.$firebase = {
  app: firebaseApp,
  auth,
  db,
  analytics
}

// Make config validation results available to components
app.config.globalProperties.$configStatus = {
  isValid: configValidation.isValid,
  capabilities: configValidation.capabilities,
  skipped: configValidation.skipped || false
}

let appMounted = false
const mountApp = () => {
  if (!appMounted) {
    app.mount('#app')
    appMounted = true
  }
}

// Initialize Firebase Functions availability check only after authentication
// Track authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user && !user.isAnonymous) {
    // User is signed in, now it's safe to check Functions availability
    console.log('User authenticated, checking Firebase Functions availability')

    // Explicitly initialize Functions and Storage
    getFunctionsInstance()
    getFirebaseStorage()

    // Check all services
    checkFirebaseReadiness().then(isReady => {
      if (!isReady) {
        console.error('WARNING: Firebase services not fully initialized. Some functionality may be limited.')
      } else {
        console.log('Firebase services initialized successfully with v2 API compatibility')
      }
      mountApp()
    }).catch(error => {
      console.error('Error during Firebase validation:', error)
      mountApp()
    })

    import('@/services')
      .then(({ aiService }) => {
        if (aiService && typeof aiService.checkFunctionsAvailability === 'function') {
          aiService.checkFunctionsAvailability()
            .catch(err => {
              console.error('Firebase Functions availability check failed:', err)
            })
        }
      })
      .catch(err => {
        console.error('Error importing services:', err)
      })
  } else {
    console.log('User not authenticated or is anonymous, checking core Firebase services')
    // Check only core services for anonymous users
    const coreServices = ['app', 'auth', 'firestore', 'analytics']
    checkFirebaseReadiness(coreServices).then(isReady => {
      if (!isReady) {
        console.error('WARNING: Core Firebase services not fully initialized. App may not function correctly.')
      } else {
        console.log('Core Firebase services initialized successfully.')
      }
      mountApp()
    }).catch(error => {
      console.error('Error during Firebase validation:', error)
      mountApp()
    })
  }
})
