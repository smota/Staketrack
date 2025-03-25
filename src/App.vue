<template>
  <v-app>
    <v-app-bar app color="primary" dark v-if="isLoggedIn || $route.meta.showNavbar !== false">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>StakeTrack</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleDarkMode">
        <v-icon>{{ isDarkMode ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
      </v-btn>
      <v-btn icon @click="logout" v-if="isLoggedIn">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app temporary v-if="isLoggedIn || $route.meta.showNavbar !== false">
      <v-list>
        <v-list-item to="/" link>
          <v-list-item-icon>
            <v-icon>mdi-home</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        
        <v-list-item to="/dashboard" link v-if="isLoggedIn">
          <v-list-item-icon>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        
        <v-list-item to="/settings" link v-if="isLoggedIn">
          <v-list-item-icon>
            <v-icon>mdi-cog</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        
        <v-list-item to="/login" link v-if="!isLoggedIn">
          <v-list-item-icon>
            <v-icon>mdi-login</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Login</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <v-footer app>
      <div class="text-caption text-center w-100">
        StakeTrack v{{ appVersion }} &copy; {{ new Date().getFullYear() }}
      </div>
    </v-footer>
  </v-app>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'

export default {
  name: 'App',
  setup() {
    const drawer = ref(false)
    const isDarkMode = ref(false)
    const isLoggedIn = ref(false)
    const appVersion = ref(process.env.VUE_APP_VERSION || '1.0.0')
    const router = useRouter()
    
    onMounted(() => {
      // Check for saved theme preference
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark') {
        isDarkMode.value = true
        document.body.classList.add('dark-theme')
      }
      
      // Set up auth state listener
      const auth = getAuth()
      onAuthStateChanged(auth, (user) => {
        isLoggedIn.value = !!user
      })
    })
    
    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value
      document.body.classList.toggle('dark-theme')
      localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
    }
    
    const logout = async () => {
      try {
        const auth = getAuth()
        await signOut(auth)
        router.push('/login')
      } catch (error) {
        console.error('Error signing out:', error)
      }
    }
    
    return {
      drawer,
      isDarkMode,
      isLoggedIn,
      appVersion,
      toggleDarkMode,
      logout
    }
  }
}
</script>

<style>
.dark-theme {
  --v-theme-background: #121212;
  --v-theme-surface: #1e1e1e;
  --v-theme-on-surface: #ffffff;
}

.v-application {
  font-family: 'Roboto', sans-serif;
}

html, body {
  overflow-x: hidden;
  margin: 0;
  padding: 0;
}
</style> 