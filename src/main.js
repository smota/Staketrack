import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './styles/main.css'
import { app as firebaseApp, auth, db, analytics } from './firebase'
import config from './config'
import { onAuthStateChanged } from 'firebase/auth'

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
const app = Vue.createApp(App)
app.use(router)
app.use(vuetify)
app.config.globalProperties.$config = config
app.config.globalProperties.$firebase = {
  app: firebaseApp,
  auth,
  db,
  analytics
}

// Initialize Firebase Functions availability check only after authentication
// Track authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, now it's safe to check Functions availability
    console.log('User authenticated, checking Firebase Functions availability')
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
    console.log('User not authenticated, skipping Firebase Functions initialization')
  }
})

app.mount('#app')
