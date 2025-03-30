<template>
  <v-container fluid class="stakeholder-map-container">
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
              Error Loading Map
            </h3>
            <p class="text-body-1 mb-4">
              {{ error }}
            </p>
            <v-btn color="primary" class="mt-4" @click="retryLoading">
              Retry
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card v-else-if="!currentMap" class="no-map-card">
          <v-card-text class="text-center">
            <v-icon size="48" color="grey" class="mb-4">
              mdi-map-outline
            </v-icon>
            <h3 class="text-h6 mb-2">
              No Map Selected
            </h3>
            <p class="text-body-1 mb-4">
              Please create or select a map first.
            </p>
            <v-btn color="primary" class="mt-4" @click="createNewMap">
              Create New Map
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card v-else class="map-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <v-btn
                icon
                class="mr-2"
                title="Back to Dashboard"
                @click="goToDashboard"
              >
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <span class="text-h5 mr-4">{{ currentMap.name }}</span>
              <v-btn icon class="mr-2" @click="editMapName">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </div>
            <div class="d-flex">
              <v-btn
                color="accent"
                class="mr-2"
                prepend-icon="mdi-lightbulb"
                :loading="aiLoading"
                :disabled="aiLoading"
                @click="getMapRecommendations"
              >
                Next Best Action
              </v-btn>
              <v-btn color="primary" @click="showAddStakeholderDialog">
                Add Stakeholder
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <div class="map-container">
              <!-- Matrix View -->
              <div class="matrix-view">
                <v-card class="matrix-container">
                  <!-- Quadrant Labels -->
                  <div class="quadrant-label top-right">
                    KEY PLAYERS
                  </div>
                  <div class="quadrant-label top-left">
                    MEET THEIR NEEDS
                  </div>
                  <div class="quadrant-label bottom-right">
                    KEEP SATISFIED
                  </div>
                  <div class="quadrant-label bottom-left">
                    SHOW CONSIDERATION
                  </div>

                  <!-- Axis Labels -->
                  <div class="x-axis-label">
                    Influence
                  </div>
                  <div class="y-axis-label">
                    Impact
                  </div>

                  <!-- Axis Dividers -->
                  <div class="x-axis-divider" />
                  <div class="y-axis-divider" />

                  <!-- Stakeholder Plots -->
                  <div
                    v-for="stakeholder in filteredStakeholders"
                    :key="stakeholder.id"
                    class="stakeholder-plot"
                    :style="getPlotStyles(stakeholder)"
                    :class="{ 'selected': selectedStakeholder && selectedStakeholder.id === stakeholder.id }"
                    @click="selectStakeholder(stakeholder)"
                  >
                    <v-tooltip :text="stakeholder.name" location="top">
                      <template #activator="{ props }">
                        <div class="plot-circle" v-bind="props" :style="getCircleStyles(stakeholder)" />
                      </template>
                    </v-tooltip>
                  </div>
                </v-card>
              </div>
            </div>

            <!-- Stakeholder List Section -->
            <v-card class="mt-4 stakeholder-list-section">
              <v-card-title>
                Stakeholders List
                <v-spacer />
                <v-text-field
                  v-model="searchQuery"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  hide-details
                  density="compact"
                  class="search-field"
                />
              </v-card-title>

              <!-- Filter section -->
              <v-card-subtitle>
                <v-row>
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="filterCategory"
                      :items="categoryOptions"
                      label="Category"
                      clearable
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="filterQuadrant"
                      :items="quadrantOptions"
                      label="Quadrant"
                      clearable
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="sortBy"
                      :items="sortOptions"
                      label="Sort By"
                      density="compact"
                    />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" sm="4">
                    <v-range-slider
                      v-model="influenceRange"
                      label="Influence"
                      min="1"
                      max="10"
                      step="1"
                      thumb-label
                    >
                      <template #prepend>
                        <span>{{ influenceRange[0] }}</span>
                      </template>
                      <template #append>
                        <span>{{ influenceRange[1] }}</span>
                      </template>
                    </v-range-slider>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-range-slider
                      v-model="impactRange"
                      label="Impact"
                      min="1"
                      max="10"
                      step="1"
                      thumb-label
                    >
                      <template #prepend>
                        <span>{{ impactRange[0] }}</span>
                      </template>
                      <template #append>
                        <span>{{ impactRange[1] }}</span>
                      </template>
                    </v-range-slider>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-range-slider
                      v-model="relationshipRange"
                      label="Relationship"
                      min="1"
                      max="10"
                      step="1"
                      thumb-label
                    >
                      <template #prepend>
                        <span>{{ relationshipRange[0] }}</span>
                      </template>
                      <template #append>
                        <span>{{ relationshipRange[1] }}</span>
                      </template>
                    </v-range-slider>
                  </v-col>
                </v-row>
              </v-card-subtitle>

              <v-data-table
                :headers="tableHeaders"
                :items="filteredStakeholdersForTable"
                :sort-by="[{ key: sortBy, order: 'asc' }]"
                class="elevation-1"
              >
                <template #[`item.category`]="{ item }">
                  <v-chip :color="getCategoryColor(item.category)" small>
                    {{ item.category }}
                  </v-chip>
                </template>

                <template #[`item.quadrant`]="{ item }">
                  <v-chip :color="getQuadrantColor(item.quadrant)" small>
                    {{ formatQuadrantName(item.quadrant) }}
                  </v-chip>
                </template>

                <template #[`item.influence`]="{ item }">
                  <v-rating
                    :model-value="item.influence"
                    readonly
                    density="compact"
                    size="small"
                    :length="10"
                    color="primary"
                  />
                </template>

                <template #[`item.impact`]="{ item }">
                  <v-rating
                    :model-value="item.impact"
                    readonly
                    density="compact"
                    size="small"
                    :length="10"
                    color="secondary"
                  />
                </template>

                <template #[`item.relationship`]="{ item }">
                  <v-rating
                    :model-value="item.relationship"
                    readonly
                    density="compact"
                    size="small"
                    :length="10"
                    color="info"
                  />
                </template>

                <template #[`item.actions`]="{ item }">
                  <div class="d-flex justify-end">
                    <v-btn
                      icon
                      size="small"
                      color="accent"
                      title="Get Recommendations"
                      @click="getStakeholderRecommendations(item)"
                    >
                      <v-icon>mdi-lightbulb</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      title="View Details"
                      @click="selectStakeholder(item)"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      title="Edit"
                      @click="editStakeholder(item)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      color="error"
                      title="Delete"
                      @click="deleteStakeholder(item)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </template>
              </v-data-table>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stakeholder Detail Dialog -->
    <v-dialog v-model="showStakeholderDetail" max-width="600px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <div>{{ selectedStakeholder ? selectedStakeholder.name : 'Stakeholder Details' }}</div>
          <v-btn icon @click="showStakeholderDetail = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text v-if="selectedStakeholder">
          <v-row>
            <v-col cols="12" sm="6">
              <strong>Influence:</strong> {{ selectedStakeholder.influence }}/10
            </v-col>
            <v-col cols="12" sm="6">
              <strong>Impact:</strong> {{ selectedStakeholder.impact }}/10
            </v-col>
            <v-col cols="12" sm="6">
              <strong>Relationship:</strong> {{ selectedStakeholder.relationship }}/10
            </v-col>
            <v-col cols="12" sm="6">
              <strong>Category:</strong> {{ selectedStakeholder.category }}
            </v-col>
            <v-col v-if="selectedStakeholder.interests" cols="12">
              <strong>Interests:</strong> {{ selectedStakeholder.interests }}
            </v-col>
            <v-col v-if="selectedStakeholder.contribution" cols="12">
              <strong>Contribution:</strong> {{ selectedStakeholder.contribution }}
            </v-col>
            <v-col v-if="selectedStakeholder.risk" cols="12">
              <strong>Risk:</strong> {{ selectedStakeholder.risk }}
            </v-col>
            <v-col v-if="selectedStakeholder.communication" cols="12">
              <strong>Communication Style:</strong> {{ selectedStakeholder.communication }}
            </v-col>
            <v-col v-if="selectedStakeholder.strategy" cols="12">
              <strong>Engagement Strategy:</strong> {{ selectedStakeholder.strategy }}
            </v-col>
            <v-col v-if="selectedStakeholder.measurement" cols="12">
              <strong>Measurement Approach:</strong> {{ selectedStakeholder.measurement }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="editStakeholder(selectedStakeholder)">
            Edit
          </v-btn>
          <v-btn
            color="accent"
            prepend-icon="mdi-lightbulb"
            @click="getStakeholderRecommendations(selectedStakeholder)"
          >
            Next Best Action
          </v-btn>
          <v-btn color="error" @click="deleteStakeholder(selectedStakeholder)">
            Delete
          </v-btn>
          <v-spacer />
          <v-btn color="secondary" @click="showStakeholderDetail = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Stakeholder Dialog -->
    <v-dialog v-model="addDialog" max-width="600px">
      <v-card>
        <v-card-title>Add New Stakeholder</v-card-title>
        <v-card-text>
          <v-form
            ref="addForm"
            v-model="isAddFormValid"
            @keydown.enter.prevent="isAddFormValid && addStakeholder()"
            @keydown.esc="addDialog = false"
          >
            <v-text-field
              v-model="newStakeholder.name"
              label="Name"
              :rules="[v => !!v || 'Name is required']"
              required
              autofocus
            />
            <v-select
              v-model="newStakeholder.category"
              :items="categoryOptions"
              label="Category"
              :rules="[v => !!v || 'Category is required']"
              required
            />
            <v-slider
              v-model="newStakeholder.influence"
              label="Influence"
              min="1"
              max="10"
              step="1"
              thumb-label
              ticks
            />
            <v-slider
              v-model="newStakeholder.impact"
              label="Impact"
              min="1"
              max="10"
              step="1"
              thumb-label
              ticks
            />
            <v-slider
              v-model="newStakeholder.relationship"
              label="Relationship"
              min="1"
              max="10"
              step="1"
              thumb-label
              ticks
            />
            <v-textarea v-model="newStakeholder.interests" label="Interests" rows="3" />
            <v-textarea v-model="newStakeholder.contribution" label="Contribution" rows="3" />
            <v-textarea v-model="newStakeholder.risk" label="Risk" rows="3" />
            <v-textarea v-model="newStakeholder.communication" label="Communication" rows="3" />
            <v-textarea v-model="newStakeholder.strategy" label="Engagement Strategy" rows="3" />
            <v-textarea v-model="newStakeholder.measurement" label="Measurement" rows="3" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="addDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" :disabled="!isAddFormValid" @click="addStakeholder">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Map Dialog -->
    <v-dialog v-model="editMapDialog" max-width="500px">
      <v-card>
        <v-card-title>Edit Map</v-card-title>
        <v-card-text>
          <v-form
            ref="editMapForm"
            v-model="isEditMapFormValid"
            @keydown.enter.prevent="isEditMapFormValid && saveMapChanges()"
            @keydown.esc="editMapDialog = false"
          >
            <v-text-field
              v-model="editedMapData.name"
              label="Map Name"
              :rules="[v => !!v || 'Name is required']"
              required
              autofocus
            />
            <v-textarea v-model="editedMapData.description" label="Description" rows="3" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="editMapDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" :disabled="!isEditMapFormValid" @click="saveMapChanges">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Stakeholder Dialog -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title>Edit Stakeholder</v-card-title>
        <v-card-text>
          <v-form
            ref="editForm"
            v-model="isEditFormValid"
            @keydown.enter.prevent="isEditFormValid && updateStakeholder()"
            @keydown.esc="editDialog = false"
          >
            <v-text-field
              v-model="editedStakeholder.name"
              label="Name"
              :rules="[v => !!v || 'Name is required']"
              required
              autofocus
            />
            <v-select
              v-model="editedStakeholder.category"
              :items="categoryOptions"
              label="Category"
              :rules="[v => !!v || 'Category is required']"
              required
            />
            <v-slider
              v-model="editedStakeholder.influence"
              label="Influence"
              min="1"
              max="10"
              step="1"
              thumb-label
              ticks
            />
            <v-slider
              v-model="editedStakeholder.impact"
              label="Impact"
              min="1"
              max="10"
              step="1"
              thumb-label
              ticks
            />
            <v-slider
              v-model="editedStakeholder.relationship"
              label="Relationship"
              min="1"
              max="10"
              step="1"
              thumb-label
              ticks
            />
            <v-textarea v-model="editedStakeholder.interests" label="Interests" rows="3" />
            <v-textarea v-model="editedStakeholder.contribution" label="Contribution" rows="3" />
            <v-textarea v-model="editedStakeholder.risk" label="Risk" rows="3" />
            <v-textarea v-model="editedStakeholder.communication" label="Communication" rows="3" />
            <v-textarea v-model="editedStakeholder.strategy" label="Engagement Strategy" rows="3" />
            <v-textarea v-model="editedStakeholder.measurement" label="Measurement" rows="3" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="editDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" :disabled="!isEditFormValid" @click="updateStakeholder">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Recommendation Dialog -->
    <v-dialog v-model="actionsDialog" max-width="900px">
      <v-card>
        <v-card-title>{{ dialogTitle }}</v-card-title>
        <v-card-text>
          <div v-if="dialogContent.loading">
            <div class="d-flex flex-column align-center justify-center py-4">
              <v-progress-circular indeterminate color="primary" />
              <div class="text-subtitle-1 mt-4">
                Generating AI recommendations...
              </div>
            </div>
          </div>

          <div v-else-if="dialogContent.authRequired">
            <div class="auth-required-container d-flex flex-column align-center justify-center pa-4">
              <v-icon color="warning" size="48">
                mdi-account-lock
              </v-icon>
              <h3 class="text-h5 font-weight-bold my-3">
                Authentication Required
              </h3>
              <p class="text-body-1 text-center mb-4">
                You need to be logged in to access AI recommendations.
              </p>
              <v-btn color="primary" @click="navigateToLogin">
                Log In Now
              </v-btn>
            </div>
          </div>

          <div v-else-if="dialogContent.limitReached">
            <div class="limit-reached-container d-flex flex-column align-center justify-center pa-4">
              <v-icon color="warning" size="48">
                mdi-alert-circle
              </v-icon>
              <h3 class="text-h5 font-weight-bold my-3">
                Usage Limit Reached
              </h3>
              <p class="text-body-1 text-center mb-4">
                {{ dialogContent.message }}
              </p>
              <v-progress-linear
                color="warning"
                height="10"
                :value="(dialogContent.currentUsage / dialogContent.limit) * 100"
                class="mb-2"
              />
              <p class="text-caption text-center">
                Contact your administrator for unlimited access.
              </p>
            </div>
          </div>

          <div v-else>
            <div v-if="dialogContent.text" class="recommendation-content">
              <vue-markdown :source="dialogContent.text" />
            </div>
            <div v-else class="text-center py-4">
              <v-icon color="error" size="large">
                mdi-alert
              </v-icon>
              <div class="text-h6 mt-2">
                Unable to generate recommendations
              </div>
              <div class="text-body-2 mt-1">
                {{ dialogContent.error || 'Please try again later.' }}
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="actionsDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mapService, stakeholderService } from '@/services/index'
import { Stakeholder } from '@/models/Stakeholder'
import config from '@/config'
import { categoryOptions, getCategoryColor } from '@/config/categories'
import { useStakeholderStore } from '@/stores/stakeholderStore'
import { useNotificationStore } from '@/stores/notificationStore'
import aiService from '@/services/aiService'
import { getAuth } from 'firebase/auth'

// Quadrant options
const quadrantOptions = [
  { title: 'Key Players', value: 'manage-closely' },
  { title: 'Meet Their Needs', value: 'keep-informed' },
  { title: 'Keep Satisfied', value: 'keep-satisfied' },
  { title: 'Show Consideration', value: 'monitor' }
]

// Sort options
const sortOptions = [
  { title: 'Name', value: 'name' },
  { title: 'Category', value: 'category' },
  { title: 'Influence', value: 'influence' },
  { title: 'Impact', value: 'impact' },
  { title: 'Relationship', value: 'relationship' },
  { title: 'Quadrant', value: 'quadrant' }
]

export default {
  name: 'StakeholderMap',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const mapId = computed(() => route.params.id)

    const stakeholderStore = useStakeholderStore()
    const notificationStore = useNotificationStore()

    // Loading and error states
    const loading = ref(true)
    const error = ref(null)

    // Map data
    const currentMap = ref(null)
    const stakeholders = ref([])

    // Dialog states
    const addDialog = ref(false)
    const editDialog = ref(false)
    const deleteDialog = ref(false)
    const editMapDialog = ref(false)
    const actionsDialog = ref(false)
    const dialogTitle = ref('')
    const dialogContent = ref({})
    const showStakeholderDetail = ref(false)

    // Form validation states
    const isEditMapFormValid = ref(false)
    const editedMapData = ref({
      name: '',
      description: ''
    })

    // Dialog form state
    const newStakeholder = ref(new Stakeholder({ mapId: mapId.value }))
    const editedStakeholder = ref(null)
    const selectedStakeholder = ref(null)
    const isAddFormValid = ref(false)
    const isEditFormValid = ref(false)

    // Search and filter
    const searchQuery = ref('')
    const filterCategory = ref(null)
    const filterQuadrant = ref(null)
    const influenceRange = ref([1, 10])
    const impactRange = ref([1, 10])
    const relationshipRange = ref([1, 10])
    const sortBy = ref('name')

    // AI recommendation loading state
    const aiLoading = ref(false)

    const tableHeaders = [
      { title: 'Name', key: 'name' },
      { title: 'Category', key: 'category' },
      { title: 'Influence', key: 'influence' },
      { title: 'Impact', key: 'impact' },
      { title: 'Relationship', key: 'relationship' },
      { title: 'Quadrant', key: 'quadrant' },
      { title: 'Actions', key: 'actions', sortable: false }
    ]

    // Basic filtering for the map view
    const filteredStakeholders = computed(() => {
      return stakeholders.value
    })

    // Advanced filtering for the table view
    const filteredStakeholdersForTable = computed(() => {
      let filtered = stakeholders.value

      // Text search
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(s =>
          s.name.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
        )
      }

      // Category filter
      if (filterCategory.value) {
        filtered = filtered.filter(s => s.category === filterCategory.value)
      }

      // Quadrant filter
      if (filterQuadrant.value) {
        filtered = filtered.filter(s => s.quadrant === filterQuadrant.value)
      }

      // Range filters
      filtered = filtered.filter(s =>
        s.influence >= influenceRange.value[0] &&
        s.influence <= influenceRange.value[1] &&
        s.impact >= impactRange.value[0] &&
        s.impact <= impactRange.value[1] &&
        s.relationship >= relationshipRange.value[0] &&
        s.relationship <= relationshipRange.value[1]
      )

      return filtered
    })

    const loadCurrentMap = async () => {
      try {
        loading.value = true
        error.value = null
        currentMap.value = await mapService.getCurrentMap()

        if (currentMap.value) {
          console.log('Loading stakeholders for map:', currentMap.value.id)
          const loadedStakeholders = await stakeholderService.getStakeholders(currentMap.value.id)
          console.log('Loaded stakeholders:', loadedStakeholders)
          console.log('Stakeholder types check:', loadedStakeholders.map(s => {
            return {
              id: s.id,
              name: s.name,
              isInstance: s instanceof Stakeholder,
              hasQuadrant: s.quadrant !== undefined,
              influence: s.influence,
              impact: s.impact
            }
          }))

          // Force reactivity with a new array assignment
          stakeholders.value = [...loadedStakeholders]
          console.log('Set stakeholders array:', stakeholders.value)
          console.log('Filtered stakeholders (should match stakeholders array):', filteredStakeholders.value)

          // Ensure map is properly saved with correct stakeholder count
          await mapService.updateMap(currentMap.value.id, {
            stakeholderCount: stakeholders.value.length,
            updatedAt: new Date()
          })
        }
      } catch (err) {
        console.error('Error loading map:', err)
        error.value = 'Failed to load map. Please try again.'
      } finally {
        loading.value = false
      }
    }

    const addStakeholder = async () => {
      try {
        if (!currentMap.value) {
          error.value = 'No map selected. Please create or select a map first.'
          return
        }

        const stakeholderData = {
          ...newStakeholder.value,
          mapId: currentMap.value.id
        }

        console.log('Adding stakeholder with data:', stakeholderData)

        const addedStakeholder = await stakeholderService.addStakeholder(
          currentMap.value.id,
          stakeholderData
        )

        console.log('Received added stakeholder:', addedStakeholder)
        console.log('Current stakeholders before update:', [...stakeholders.value])

        // Force reactive update by creating a new array
        stakeholders.value = [...stakeholders.value, addedStakeholder]

        console.log('Updated stakeholders array:', [...stakeholders.value])
        console.log('Filtered stakeholders:', [...filteredStakeholders.value])

        addDialog.value = false

        // Update stakeholder count in the map and ensure it's saved
        currentMap.value.stakeholderCount = stakeholders.value.length

        // Save map with updated information
        await mapService.updateMap(currentMap.value.id, {
          stakeholderCount: stakeholders.value.length,
          updatedAt: new Date()
        })
      } catch (err) {
        console.error('Error adding stakeholder:', err)
        error.value = 'Failed to add stakeholder. Please try again.'
      }
    }

    // Helper function to format quadrant name for display
    const formatQuadrantName = (quadrant) => {
      const mappings = {
        'manage-closely': 'Key Players',
        'keep-informed': 'Meet Their Needs',
        'keep-satisfied': 'Keep Satisfied',
        'monitor': 'Show Consideration'
      }
      return mappings[quadrant] || quadrant
    }

    // Helper to get quadrant color
    const getQuadrantColor = (quadrant) => {
      const colorMap = {
        'manage-closely': 'red',
        'keep-informed': 'orange',
        'keep-satisfied': 'blue',
        'monitor': 'green'
      }
      return colorMap[quadrant] || 'grey'
    }

    const selectStakeholder = (stakeholder) => {
      selectedStakeholder.value = stakeholder
      showStakeholderDetail.value = true
    }

    const editStakeholder = async (stakeholder) => {
      // Properly extract all properties from the stakeholder model instance
      // instead of using shallow spread which doesn't work with getters
      editedStakeholder.value = {
        id: stakeholder.id,
        name: stakeholder.name,
        category: stakeholder.category,
        influence: stakeholder.influence,
        impact: stakeholder.impact,
        relationship: stakeholder.relationship,
        interests: stakeholder.interests,
        contribution: stakeholder.contribution,
        risk: stakeholder.risk,
        communication: stakeholder.communication,
        strategy: stakeholder.strategy,
        measurement: stakeholder.measurement
      }
      editDialog.value = true
    }

    const updateStakeholder = async () => {
      try {
        if (!currentMap.value || !editedStakeholder.value.id) return

        const updatedStakeholder = await stakeholderService.updateStakeholder(
          currentMap.value.id,
          editedStakeholder.value.id,
          editedStakeholder.value
        )

        console.log('Updated stakeholder:', updatedStakeholder)

        // Update stakeholder in the local list with reactive approach
        const index = stakeholders.value.findIndex(s => s.id === updatedStakeholder.id)
        if (index !== -1) {
          // Create a new array with the updated stakeholder
          const updatedStakeholders = [...stakeholders.value]
          updatedStakeholders[index] = updatedStakeholder
          stakeholders.value = updatedStakeholders
        }

        // If this was the selected stakeholder, update it
        if (selectedStakeholder.value?.id === updatedStakeholder.id) {
          selectedStakeholder.value = updatedStakeholder
        }

        // Update map's last updated timestamp
        currentMap.value.updatedAt = new Date()

        // Save the entire map with updated information, not just stakeholder count
        await mapService.updateMap(currentMap.value.id, {
          stakeholderCount: stakeholders.value.length,
          updatedAt: new Date()
        })

        editDialog.value = false
      } catch (err) {
        console.error('Error updating stakeholder:', err)
        error.value = 'Failed to update stakeholder. Please try again.'
      }
    }

    const deleteStakeholder = async (stakeholder) => {
      if (confirm(`Are you sure you want to delete ${stakeholder.name}?`)) {
        try {
          await stakeholderService.deleteStakeholder(currentMap.value.id, stakeholder.id)
          stakeholders.value = stakeholders.value.filter(s => s.id !== stakeholder.id)
          if (selectedStakeholder.value?.id === stakeholder.id) {
            selectedStakeholder.value = null
            showStakeholderDetail.value = false
          }

          // Update map's last updated timestamp
          currentMap.value.updatedAt = new Date()

          // Save the entire map with updated information, not just stakeholder count
          await mapService.updateMap(currentMap.value.id, {
            stakeholderCount: stakeholders.value.length,
            updatedAt: new Date()
          })
        } catch (err) {
          console.error('Error deleting stakeholder:', err)
          error.value = 'Failed to delete stakeholder. Please try again.'
        }
      }
    }

    const showAddStakeholderDialog = () => {
      console.log('showAddStakeholderDialog called')

      // Initialize the new stakeholder with default values
      newStakeholder.value = {
        name: '',
        category: 'external',
        influence: 5,
        impact: 5,
        relationship: 5,
        interests: '',
        strategy: '',
        contribution: '',
        risk: '',
        communication: '',
        measurement: ''
      }

      // Show the dialog - update the source ref, not the computed property
      addDialog.value = true
      console.log('addDialog value set to:', addDialog.value)
    }

    const editMapName = () => {
      console.log('editMapName called')

      if (currentMap.value) {
        editedMapData.value = {
          name: currentMap.value.name,
          description: currentMap.value.description || ''
        }

        // Show the dialog - update the source ref, not the computed property
        editMapDialog.value = true
        console.log('editMapDialog value set to:', editMapDialog.value)
      }
    }

    const saveMapChanges = async () => {
      try {
        if (!currentMap.value) return

        await mapService.updateMap(currentMap.value.id, {
          name: editedMapData.value.name,
          description: editedMapData.value.description,
          updatedAt: new Date()
        })

        // Update local map data
        currentMap.value.name = editedMapData.value.name
        currentMap.value.description = editedMapData.value.description
        currentMap.value.updatedAt = new Date()

        editMapDialog.value = false
      } catch (err) {
        console.error('Error updating map:', err)
        error.value = 'Failed to update map. Please try again.'
      }
    }

    const getPlotStyles = (stakeholder) => {
      // Position based on influence (x) and impact (y)
      const x = (stakeholder.influence / 10) * 100
      const y = 100 - (stakeholder.impact / 10) * 100
      return {
        left: `${x}%`,
        top: `${y}%`
      }
    }

    const getCircleStyles = (stakeholder) => {
      // Size based on relationship quality (1-10)
      const size = 10 + (stakeholder.relationship / 10) * 20
      return {
        width: `${size}px`,
        height: `${size}px`
      }
    }

    const retryLoading = () => {
      loadCurrentMap()
    }

    const createNewMap = async () => {
      try {
        const newMap = await mapService.createMap({
          name: 'New Stakeholder Map',
          description: ''
        })

        // Set current map and ensure it's saved
        await mapService.setCurrentMapId(newMap.id)

        // Navigate to the new map
        window.location.href = `${window.location.origin}/maps/${newMap.id}`
      } catch (err) {
        console.error('Error creating new map:', err)
        error.value = 'Failed to create new map. Please try again.'
      }
    }

    const goToDashboard = async () => {
      try {
        // Save current map state before navigating
        if (currentMap.value) {
          // If there are any unsaved changes, save them to ensure map appears in dashboard
          await mapService.updateMap(currentMap.value.id, currentMap.value)
        }
        router.push('/dashboard')
      } catch (err) {
        console.error('Error while navigating to dashboard:', err)
      }
    }

    const getMapRecommendations = async () => {
      try {
        // Check authentication first
        const auth = getAuth()
        const user = auth.currentUser

        if (!user || user.isAnonymous) {
          // Show login required dialog
          dialogTitle.value = 'Authentication Required'
          dialogContent.value = {
            authRequired: true,
            message: 'This feature requires authentication. Please log in to access AI-powered recommendations.'
          }
          actionsDialog.value = true
          return
        }

        aiLoading.value = true

        if (!currentMap.value || !currentMap.value.id) {
          throw new Error('Map data not available')
        }

        // Call AI service to get recommendations
        const response = await aiService.getStakeholderRecommendations(currentMap.value.id)

        // Show modal with recommendations
        showRecommendationsDialog(response)
      } catch (error) {
        console.error('Error getting map recommendations:', error)
        notificationStore.showNotification({
          message: 'Error getting recommendations: ' + error.message,
          type: 'error'
        })
      } finally {
        aiLoading.value = false
      }
    }

    const showRecommendationsDialog = (recommendations) => {
      // Implementation details would depend on your UI framework
      // Here's a basic example
      actionsDialog.value = true
      dialogTitle.value = 'Next Best Actions for Map'
      dialogContent.value = recommendations
    }

    const getStakeholderRecommendations = async (stakeholder) => {
      try {
        // Check authentication first
        const auth = getAuth()
        const user = auth.currentUser

        if (!user || user.isAnonymous) {
          // Show login required dialog
          dialogTitle.value = 'Authentication Required'
          dialogContent.value = {
            authRequired: true,
            message: 'This feature requires authentication. Please log in to access AI-powered recommendations.'
          }
          actionsDialog.value = true
          return
        }

        aiLoading.value = true

        if (!currentMap.value || !currentMap.value.id) {
          throw new Error('Map data not available')
        }

        // Call AI service with focus on this specific stakeholder
        const response = await aiService.getStakeholderRecommendations(currentMap.value.id, {
          specificFocus: `stakeholder:${stakeholder.id}`
        })

        // Show modal with recommendations
        dialogTitle.value = `Recommendations for ${stakeholder.name}`
        dialogContent.value = response
        actionsDialog.value = true
      } catch (error) {
        console.error('Error getting stakeholder recommendations:', error)
        notificationStore.showNotification({
          message: 'Error getting recommendations: ' + error.message,
          type: 'error'
        })
      } finally {
        aiLoading.value = false
      }
    }

    // Navigate to login page
    const navigateToLogin = () => {
      router.push('/login')
      actionsDialog.value = false
    }

    onMounted(() => {
      loadCurrentMap()
    })

    // Save map when component is destroyed (navigation, page refresh, etc.)
    onBeforeUnmount(async () => {
      try {
        if (currentMap.value) {
          console.log('Saving map before unmount:', currentMap.value.id)
          await mapService.updateMap(currentMap.value.id, currentMap.value)
        }
      } catch (err) {
        console.error('Error saving map on unmount:', err)
      }
    })

    return {
      loading,
      error,
      currentMap,
      stakeholders,
      searchQuery,
      selectedStakeholder,
      showStakeholderDetail,
      tableHeaders,
      filteredStakeholders,
      filteredStakeholdersForTable,
      retryLoading,
      createNewMap,
      goToDashboard,
      selectStakeholder,
      editStakeholder,
      deleteStakeholder,
      showAddStakeholderDialog,
      editMapName,
      getPlotStyles,
      getCircleStyles,
      getCategoryColor,
      categoryOptions,
      quadrantOptions,
      sortOptions,
      // New filter and sort properties
      filterCategory,
      filterQuadrant,
      influenceRange,
      impactRange,
      relationshipRange,
      sortBy,
      formatQuadrantName,
      getQuadrantColor,
      // Existing properties
      addDialog,
      isAddFormValid,
      newStakeholder,
      addStakeholder,
      editMapDialog,
      isEditMapFormValid,
      editedMapData,
      saveMapChanges,
      editDialog,
      isEditFormValid,
      editedStakeholder,
      updateStakeholder,
      getMapRecommendations,
      showRecommendationsDialog,
      aiLoading,
      actionsDialog,
      dialogTitle,
      dialogContent,
      navigateToLogin
    }
  }
}
</script>

<style scoped>
.stakeholder-map-container {
  padding: 24px;
}

.loading-card,
.error-card,
.no-map-card,
.map-card {
  max-width: 1200px;
  margin: 0 auto;
}

.map-container {
  min-height: 500px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 16px;
  position: relative;
}

.matrix-container {
  position: relative;
  width: 100%;
  height: 500px;
  background-color: white;
  border-radius: 4px;
}

.stakeholder-list-section {
  margin-top: 24px;
}

.quadrant-label {
  position: absolute;
  font-weight: bold;
  text-align: center;
  width: 120px;
}

.search-field {
  max-width: 300px;
}

.top-right {
  top: 20px;
  right: 20px;
}

.top-left {
  top: 20px;
  left: 20px;
}

.bottom-right {
  bottom: 20px;
  right: 20px;
}

.bottom-left {
  bottom: 20px;
  left: 20px;
}

.x-axis-label,
.y-axis-label {
  position: absolute;
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  z-index: 2;
}

.x-axis-label {
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.y-axis-label {
  top: 50%;
  left: 16px;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: left center;
}

.x-axis-divider,
.y-axis-divider {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.12);
}

.x-axis-divider {
  width: 1px;
  height: 100%;
  left: 50%;
}

.y-axis-divider {
  width: 100%;
  height: 1px;
  top: 50%;
}

.stakeholder-plot {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.plot-circle {
  border-radius: 50%;
  background-color: rgba(33, 150, 243, 0.7);
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.stakeholder-plot:hover .plot-circle {
  transform: scale(1.2);
}

.stakeholder-plot.selected .plot-circle {
  background-color: #e91e63;
  transform: scale(1.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.auth-required-container,
.limit-reached-container {
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
}

.usage-stats {
  max-width: 400px;
  margin: 0 auto;
}
</style>
