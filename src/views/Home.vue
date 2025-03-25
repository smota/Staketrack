<template>
  <div class="home">
    <v-container>
      <v-row justify="center" align="center">
        <v-col cols="12" md="10" lg="8">
          <v-card class="mt-5">
            <v-card-title class="text-h4 text-center">
              Welcome to StakeTrack
            </v-card-title>
            <v-card-subtitle class="text-center">
              Comprehensive stakeholder management and visualization
            </v-card-subtitle>
            
            <v-card-text>
              <div class="text-center mb-4">
                <v-img
                  src="@/assets/logo.png"
                  alt="StakeTrack Logo"
                  max-width="200"
                  class="mx-auto"
                ></v-img>
              </div>
              
              <p class="text-body-1">
                StakeTrack helps you manage your stakeholder relationships effectively 
                by visualizing influence-impact matrices, tracking interactions, and 
                providing AI-powered engagement recommendations.
              </p>
              
              <v-row class="mt-5">
                <v-col cols="12" sm="4">
                  <v-card height="100%">
                    <v-card-title>
                      <v-icon color="primary" size="large" class="mr-2">
                        mdi-account-group
                      </v-icon>
                      Stakeholder Profiles
                    </v-card-title>
                    <v-card-text>
                      Document stakeholders with detailed attributes including 
                      influence, impact, relationship quality, and more.
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" sm="4">
                  <v-card height="100%">
                    <v-card-title>
                      <v-icon color="primary" size="large" class="mr-2">
                        mdi-chart-bubble
                      </v-icon>
                      Visual Matrix
                    </v-card-title>
                    <v-card-text>
                      Interactive quadrant map to visualize stakeholders based 
                      on their strategic importance.
                    </v-card-text>
                  </v-card>
                </v-col>
                
                <v-col cols="12" sm="4">
                  <v-card height="100%">
                    <v-card-title>
                      <v-icon color="primary" size="large" class="mr-2">
                        mdi-brain
                      </v-icon>
                      AI Recommendations
                    </v-card-title>
                    <v-card-text>
                      Get personalized advice for stakeholder engagement 
                      and next best actions.
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              
              <div class="text-center mt-8">
                <v-btn
                  color="primary"
                  x-large
                  to="/login"
                  v-if="!isLoggedIn"
                >
                  Get Started
                </v-btn>
                <v-btn
                  color="primary"
                  x-large
                  to="/dashboard"
                  v-else
                >
                  Go to Dashboard
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

export default {
  name: 'HomeView',
  setup() {
    const isLoggedIn = ref(false)
    
    onMounted(() => {
      const auth = getAuth()
      onAuthStateChanged(auth, (user) => {
        isLoggedIn.value = !!user
      })
    })
    
    return {
      isLoggedIn
    }
  }
}
</script>

<style scoped>
.home {
  padding-bottom: 60px;
}
</style> 