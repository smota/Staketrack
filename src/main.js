import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './styles/main.css'
import { firebaseApp, auth, db, analytics } from './firebase'

// Import environment config
import config from './config'

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
app.mount('#app')
