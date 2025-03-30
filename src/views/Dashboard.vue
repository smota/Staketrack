<template>
  <div class="dashboard">
    <v-container fluid class="dashboard-container">
      <v-row>
        <v-col cols="12">
          <v-card v-if="loading" class="loading-card">
            <v-card-text class="text-center">
              <v-progress-circular indeterminate color="primary" />
            </v-card-text>
          </v-card>

          <v-card v-else-if="error" class="error-card">
            <v-card-text class="text-center">
              <v-icon color="error" size="48" class="mb-4" />
              <h3 class="text-h6 mb-2">
                Error Loading Maps
              </h3>
              <p class="text-body-1 mb-4">
                {{ error }}
              </p>
              <v-btn color="primary" class="mt-4" @click="retryLoading">
                Retry
              </v-btn>
            </v-card-text>
          </v-card>

          <v-card v-else-if="maps.length === 0" class="no-maps-card">
            <v-card-text class="text-center">
              <h3 class="text-h6 mb-2">
                No Maps Found
              </h3>
              <p class="text-body-1 mb-4">
                You don't have any stakeholder maps yet. Create your first map to get started!
              </p>
              <v-btn color="primary" class="mt-4" @click="createNewMap">
                Create First Map
              </v-btn>
            </v-card-text>
          </v-card>

          <v-card v-else class="maps-card">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Your Stakeholder Maps ({{ maps.length }})</span>
              <v-btn color="primary" class="ml-4" @click="createNewMap">
                Create New Map
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col v-for="map in maps" :key="map.id" cols="12" sm="6" md="4" lg="3" class="map-card-col">
                  <v-card class="map-card" :class="{ 'current-map': map.id === currentMapId }" @click="selectMap(map)">
                    <v-card-title>{{ map.name }}</v-card-title>
                    <v-card-text>
                      <p class="text-body-2">
                        {{ map.description || 'No description' }}
                      </p>
                      <p class="text-caption">
                        Stakeholders: {{ map.stakeholderCount || 0 }}
                      </p>
                      <p class="text-caption">
                        Last updated: {{ safeFormatDate(map.lastUpdated) }}
                      </p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card v-if="isAnonymous" class="anonymous-mode-card mt-4">
            <v-card-text class="text-center">
              <p class="text-body-1 mb-4">
                You're currently in anonymous mode. Maps will be stored in your browser's local storage.
              </p>
              <v-btn outlined color="secondary" class="mt-2" @click="goToLogin">
                Sign In to Sync Maps
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="dialogVisible" max-width="500">
        <v-card>
          <v-card-title>{{ dialogMode === 'create' ? 'Create New Map' : 'Edit Map' }}</v-card-title>

          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <v-text-field v-model="editedMap.name" label="Map Name" :rules="[v => !!v || 'Name is required']"
                required />

              <v-textarea v-model="editedMap.description" label="Description" rows="3" />
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn text @click="closeDialog">
              Cancel
            </v-btn>
            <v-btn color="primary" :disabled="!isFormValid" @click="saveMap">
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="deleteDialogVisible" max-width="400">
        <v-card>
          <v-card-title class="text-h5">
            Delete Map
          </v-card-title>

          <v-card-text>
            Are you sure you want to delete "{{ mapToDelete?.name }}"? This action cannot be undone.
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn text @click="deleteDialogVisible = false">
              Cancel
            </v-btn>
            <v-btn color="error" @click="deleteMap">
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth } from '@/firebase'
import { mapService } from '@/services/mapService'
import { formatDate } from '@/utils/dateUtils'

const router = useRouter()
const route = useRoute()
const maps = ref([])
const loading = ref(true)
const error = ref(null)
const currentMapId = ref(null)

const isAnonymous = computed(() => {
  return !auth.currentUser || (auth.currentUser && auth.currentUser.isAnonymous) || false
})

const handleError = (error) => {
  console.error('Error:', error)
  error.value = 'An error occurred while loading data. Please try again.'
}

const loadMaps = async () => {
  loading.value = true
  error.value = null

  try {
    // Use mapService to get maps (will use localStorage in anonymous mode)
    const retrievedMaps = await mapService.getMaps()
    console.log('Raw retrieved maps:', retrievedMaps)

    if (!Array.isArray(retrievedMaps)) {
      console.error('Retrieved maps is not an array:', retrievedMaps)
      maps.value = []
    } else {
      // Ensure each map has the expected properties in the correct format
      maps.value = retrievedMaps.map(map => {
        // Create a normalized map object that handles both property formats
        return {
          id: map.id || map._id,
          name: map.name || map._name,
          description: map.description || map._description,
          stakeholderCount: map.stakeholderCount || map._stakeholderCount || 0,
          lastUpdated: map.lastUpdated || map._lastUpdated,
          createdAt: map.createdAt || map._createdAt
        }
      })

      // Sort maps by last updated date for better user experience
      maps.value.sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0)
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0)
        return dateB - dateA
      })
    }

    currentMapId.value = mapService.getCurrentMapId()
    console.log('Loaded maps:', maps.value, 'Count:', maps.value.length)
  } catch (error) {
    console.error('Error in loadMaps:', error)
    handleError(error)
  } finally {
    loading.value = false
  }
}

// Watch for changes in anonymous mode
watch(isAnonymous, (newValue) => {
  // Load maps regardless of anonymous state
  loadMaps()
})

// Watch for route changes to reload maps
watch(() => route.path, () => {
  loadMaps()
})

// Always reload maps when the dashboard is mounted or activated
onMounted(() => {
  loadMaps()
})

// Create a new map
const createNewMap = async () => {
  try {
    const newMap = await mapService.createMap({
      name: 'New Stakeholder Map',
      description: ''
    })
    // Set current map ID first
    await mapService.setCurrentMapId(newMap.id)
    // Then navigate with proper path
    router.push(`/maps/${newMap.id}`)
  } catch (error) {
    console.error('Error creating new map:', error)
    error.value = 'Failed to create new map. Please try again.'
  }
}

const selectMap = async (map) => {
  try {
    await mapService.setCurrentMapId(map.id)
    currentMapId.value = map.id
    router.push(`/maps/${map.id}`)
  } catch (error) {
    console.error('Error selecting map:', error)
    error.value = 'Failed to select map. Please try again.'
  }
}

const retryLoading = () => {
  loadMaps()
}

const goToLogin = () => {
  router.push({
    path: '/login',
    query: { redirect: '/dashboard' }
  })
}

// Add a safe formatting function
const safeFormatDate = (date) => {
  if (!date) return 'Unknown date'
  try {
    return formatDate(date)
  } catch (err) {
    console.error('Error formatting date:', err, date)
    return 'Invalid date'
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.dashboard-container {
  padding: 24px;
}

.anonymous-mode-card,
.loading-card,
.error-card,
.maps-card {
  max-width: 1200px;
  margin: 0 auto;
}

.map-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.map-card.current-map {
  border: 2px solid var(--v-primary-base);
}

.map-card-col {
  margin-bottom: 24px;
}

.text-h4 {
  color: var(--v-primary-base);
}

.text-body-1 {
  color: var(--v-secondary-base);
}
</style>
