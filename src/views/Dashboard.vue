<template>
  <div class="dashboard">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card class="mb-5">
            <v-card-title class="text-h4">
              Your Dashboard
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="createNewMap">
                <v-icon left>mdi-plus</v-icon>
                New Map
              </v-btn>
            </v-card-title>
            
            <v-card-text>
              <div v-if="isLoading" class="text-center my-5">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <p class="mt-3">Loading your stakeholder maps...</p>
              </div>
              
              <div v-else-if="maps.length === 0" class="text-center my-5 py-5">
                <v-icon x-large color="grey lighten-1">mdi-map-outline</v-icon>
                <h3 class="mt-3 text-h5 text-grey-darken-1">No Maps Found</h3>
                <p class="mt-2 text-grey-darken-1">Create your first stakeholder map to get started.</p>
                <v-btn color="primary" class="mt-4" @click="createNewMap">
                  <v-icon left>mdi-plus</v-icon>
                  Create New Map
                </v-btn>
              </div>
              
              <v-row v-else>
                <v-col v-for="map in maps" :key="map.id" cols="12" sm="6" md="4" lg="3">
                  <v-card class="map-card" hover @click="openMap(map.id)">
                    <v-card-title>
                      <v-icon left color="primary">mdi-map</v-icon>
                      {{ map.name }}
                    </v-card-title>
                    
                    <v-card-subtitle>
                      Created: {{ formatDate(map.createdAt) }}
                    </v-card-subtitle>
                    
                    <v-card-text>
                      <p>{{ map.description }}</p>
                      <div class="mt-2">
                        <v-chip size="small" class="mr-2">
                          {{ map.stakeholderCount }} stakeholders
                        </v-chip>
                        <v-chip size="small" v-if="map.lastUpdated">
                          Updated {{ formatTimeAgo(map.lastUpdated) }}
                        </v-chip>
                      </div>
                    </v-card-text>
                    
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn icon @click.stop="editMap(map.id)">
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn icon @click.stop="confirmDeleteMap(map)">
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <v-dialog v-model="dialogVisible" max-width="500">
        <v-card>
          <v-card-title>{{ dialogMode === 'create' ? 'Create New Map' : 'Edit Map' }}</v-card-title>
          
          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <v-text-field
                v-model="editedMap.name"
                label="Map Name"
                :rules="[v => !!v || 'Name is required']"
                required
              ></v-text-field>
              
              <v-textarea
                v-model="editedMap.description"
                label="Description"
                rows="3"
              ></v-textarea>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeDialog">Cancel</v-btn>
            <v-btn
              color="primary"
              :disabled="!isFormValid"
              @click="saveMap"
            >
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      
      <v-dialog v-model="deleteDialogVisible" max-width="400">
        <v-card>
          <v-card-title class="text-h5">Delete Map</v-card-title>
          
          <v-card-text>
            Are you sure you want to delete "{{ mapToDelete?.name }}"? This action cannot be undone.
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="deleteDialogVisible = false">Cancel</v-btn>
            <v-btn
              color="error"
              @click="deleteMap"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore'

export default {
  name: 'DashboardView',
  setup() {
    const router = useRouter()
    const maps = ref([])
    const isLoading = ref(true)
    const form = ref(null)
    const isFormValid = ref(true)
    
    // Dialog controls
    const dialogVisible = ref(false)
    const dialogMode = ref('create')
    const editedMap = reactive({
      name: '',
      description: '',
      id: null
    })
    
    // Delete dialog controls
    const deleteDialogVisible = ref(false)
    const mapToDelete = ref(null)
    
    // Load user's maps from Firestore
    const loadMaps = async () => {
      isLoading.value = true
      
      try {
        const auth = getAuth()
        const db = getFirestore()
        
        if (!auth.currentUser) {
          isLoading.value = false
          return
        }
        
        const mapsRef = collection(db, 'maps')
        const q = query(mapsRef, where('userId', '==', auth.currentUser.uid))
        const querySnapshot = await getDocs(q)
        
        maps.value = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          stakeholderCount: doc.data().stakeholderCount || 0,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastUpdated: doc.data().lastUpdated?.toDate() || null
        }))
      } catch (error) {
        console.error('Error loading maps:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    // Create a new map
    const createNewMap = () => {
      editedMap.name = ''
      editedMap.description = ''
      editedMap.id = null
      dialogMode.value = 'create'
      dialogVisible.value = true
    }
    
    // Edit existing map
    const editMap = (mapId) => {
      const map = maps.value.find(m => m.id === mapId)
      if (map) {
        editedMap.name = map.name
        editedMap.description = map.description
        editedMap.id = map.id
        dialogMode.value = 'edit'
        dialogVisible.value = true
      }
    }
    
    // Save map (create or update)
    const saveMap = async () => {
      if (!form.value.validate()) return
      
      try {
        const auth = getAuth()
        const db = getFirestore()
        
        if (!auth.currentUser) return
        
        if (dialogMode.value === 'create') {
          // Create new map
          await addDoc(collection(db, 'maps'), {
            name: editedMap.name,
            description: editedMap.description,
            userId: auth.currentUser.uid,
            stakeholderCount: 0,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          })
        } else {
          // Update existing map
          const mapRef = doc(db, 'maps', editedMap.id)
          await updateDoc(mapRef, {
            name: editedMap.name,
            description: editedMap.description,
            lastUpdated: serverTimestamp()
          })
        }
        
        // Reload maps
        await loadMaps()
        
        // Close dialog
        closeDialog()
      } catch (error) {
        console.error('Error saving map:', error)
      }
    }
    
    // Open map detail view
    const openMap = (mapId) => {
      router.push(`/maps/${mapId}`)
    }
    
    // Show delete confirmation dialog
    const confirmDeleteMap = (map) => {
      mapToDelete.value = map
      deleteDialogVisible.value = true
    }
    
    // Delete map
    const deleteMap = async () => {
      if (!mapToDelete.value) return
      
      try {
        const db = getFirestore()
        const mapRef = doc(db, 'maps', mapToDelete.value.id)
        await deleteDoc(mapRef)
        
        // Reload maps
        await loadMaps()
        
        // Close dialog
        deleteDialogVisible.value = false
        mapToDelete.value = null
      } catch (error) {
        console.error('Error deleting map:', error)
      }
    }
    
    // Close dialog
    const closeDialog = () => {
      dialogVisible.value = false
      editedMap.name = ''
      editedMap.description = ''
      editedMap.id = null
    }
    
    // Format date
    const formatDate = (date) => {
      if (!date) return 'Unknown'
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date)
    }
    
    // Format relative time
    const formatTimeAgo = (date) => {
      if (!date) return ''
      
      const now = new Date()
      const diffMs = now - date
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHour = Math.floor(diffMin / 60)
      const diffDay = Math.floor(diffHour / 24)
      
      if (diffDay > 30) {
        return formatDate(date)
      } else if (diffDay > 0) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
      } else if (diffHour > 0) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
      } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
      } else {
        return 'just now'
      }
    }
    
    // Load maps when component is mounted
    onMounted(() => {
      loadMaps()
    })
    
    return {
      maps,
      isLoading,
      form,
      isFormValid,
      dialogVisible,
      dialogMode,
      editedMap,
      deleteDialogVisible,
      mapToDelete,
      createNewMap,
      editMap,
      saveMap,
      openMap,
      confirmDeleteMap,
      deleteMap,
      closeDialog,
      formatDate,
      formatTimeAgo
    }
  }
}
</script>

<style scoped>
.map-card {
  transition: transform 0.2s;
  height: 100%;
}

.map-card:hover {
  transform: translateY(-5px);
}
</style> 