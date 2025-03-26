<template>
  <div class="stakeholder-map">
    <h1>Stakeholder Map</h1>
    <div class="map-controls">
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="viewType"
            :items="viewTypes"
            label="View Type"
            density="compact"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="selectedCategory"
            :items="categoryOptions"
            label="Filter by Category"
            density="compact"
            variant="outlined"
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="searchQuery"
            label="Search Stakeholders"
            density="compact"
            variant="outlined"
            clearable
            append-inner-icon="mdi-magnify"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="3"
          class="d-flex justify-end align-center"
        >
          <v-btn
            color="primary"
            class="ml-2"
            :disabled="!currentMap || !currentMap.stakeholders.length"
            @click="exportMap"
          >
            <v-icon left>
              mdi-export
            </v-icon>
            Export
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <div class="map-container">
      <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="!currentMap" class="no-map">
        <p>No stakeholder map selected. Please create or select a map first.</p>
        <v-btn color="primary" @click="createNewMap">
          Create Map
        </v-btn>
      </div>

      <div v-else-if="filteredStakeholders.length === 0" class="no-stakeholders">
        <p>No stakeholders found in this map.</p>
        <v-btn color="primary" @click="addStakeholder">
          Add Stakeholder
        </v-btn>
      </div>

      <div v-else>
        <!-- Matrix View -->
        <div v-if="viewType === 'matrix'" class="matrix-view">
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
                  <div
                    class="plot-circle"
                    v-bind="props"
                    :style="getCircleStyles(stakeholder)"
                  />
                </template>
              </v-tooltip>
            </div>
          </v-card>
        </div>

        <!-- List View Alternative -->
        <div v-else-if="viewType === 'list'" class="list-view">
          <v-data-table
            :headers="tableHeaders"
            :items="filteredStakeholders"
            :search="searchQuery"
            class="elevation-1"
          >
            <template #[`item.category`]="{ item }">
              <v-chip :color="getCategoryColor(item.category)" small>
                {{ item.category }}
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
              <v-btn icon @click="editStakeholder(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon @click="deleteStakeholder(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </div>
      </div>
    </div>

    <!-- Stakeholder Detail Panel -->
    <v-dialog v-model="showStakeholderDetail" max-width="600px">
      <v-card>
        <v-card-title>
          {{ selectedStakeholder ? selectedStakeholder.name : 'Stakeholder Details' }}
          <v-spacer />
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
  </div>
</template>

<script>
import { mapService } from '@/services/mapService'
import { stakeholderService } from '@/services/stakeholderService'
import { categoryOptions } from '@/config/categories'

export default {
  name: 'StakeholderMap',
  data() {
    return {
      loading: true,
      currentMap: null,
      stakeholders: [],
      selectedStakeholder: null,
      showStakeholderDetail: false,
      viewType: 'matrix',
      viewTypes: [
        { title: 'Matrix View', value: 'matrix' },
        { title: 'List View', value: 'list' }
      ],
      selectedCategory: null,
      searchQuery: '',
      categoryOptions: categoryOptions,
      tableHeaders: [
        { title: 'Name', key: 'name', sortable: true },
        { title: 'Category', key: 'category', sortable: true },
        { title: 'Influence', key: 'influence', sortable: true },
        { title: 'Impact', key: 'impact', sortable: true },
        { title: 'Relationship', key: 'relationship', sortable: true },
        { title: 'Actions', key: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    filteredStakeholders() {
      let filtered = this.stakeholders

      // Filter by category if selected
      if (this.selectedCategory) {
        filtered = filtered.filter(s => s.category === this.selectedCategory)
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(s =>
          s.name.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
        )
      }

      return filtered
    }
  },
  async created() {
    await this.loadCurrentMap()
  },
  methods: {
    async loadCurrentMap() {
      try {
        this.loading = true
        this.currentMap = await mapService.getCurrentMap()

        if (this.currentMap) {
          this.stakeholders = await stakeholderService.getStakeholders(this.currentMap.id)
        }
      } catch (error) {
        console.error('Error loading map:', error)
        // Add error handling UI if needed
      } finally {
        this.loading = false
      }
    },

    getPlotStyles(stakeholder) {
      // Position based on influence (x) and impact (y)
      // Convert from 1-10 scale to percentage position (10-90% to avoid edges)
      const xPos = 10 + ((stakeholder.influence - 1) / 9) * 80
      const yPos = 90 - ((stakeholder.impact - 1) / 9) * 80 // Invert Y-axis (top = high impact)

      return {
        left: `${xPos}%`,
        top: `${yPos}%`
      }
    },

    getCircleStyles(stakeholder) {
      // Size based on relationship quality (1-10)
      const baseSize = 16
      const maxSizeIncrease = 24
      const size = baseSize + ((stakeholder.relationship - 1) / 9) * maxSizeIncrease

      // Color based on category
      const color = this.getCategoryColor(stakeholder.category)

      return {
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color
      }
    },

    getCategoryColor(category) {
      const categoryColors = {
        executive: '#8E24AA', // purple
        manager: '#1E88E5', // blue
        team_member: '#43A047', // green
        customer: '#FB8C00', // orange
        partner: '#F4511E', // deep orange
        regulator: '#C62828', // red
        other: '#757575' // grey
      }

      return categoryColors[category] || categoryColors.other
    },

    selectStakeholder(stakeholder) {
      this.selectedStakeholder = stakeholder
      this.showStakeholderDetail = true
    },

    async createNewMap() {
      try {
        // Redirect to map creation page or open a dialog
        this.$router.push('/maps/new')
      } catch (error) {
        console.error('Error creating map:', error)
      }
    },

    async addStakeholder() {
      try {
        // Redirect to stakeholder creation page or open a dialog
        this.$router.push(`/maps/${this.currentMap.id}/stakeholders/new`)
      } catch (error) {
        console.error('Error adding stakeholder:', error)
      }
    },

    async editStakeholder(stakeholder) {
      try {
        // Redirect to stakeholder edit page or open a dialog
        this.$router.push(`/maps/${this.currentMap.id}/stakeholders/${stakeholder.id}/edit`)
      } catch (error) {
        console.error('Error editing stakeholder:', error)
      }
    },

    async deleteStakeholder(stakeholder) {
      if (confirm(`Are you sure you want to delete ${stakeholder.name}?`)) {
        try {
          await stakeholderService.deleteStakeholder(this.currentMap.id, stakeholder.id)
          this.stakeholders = this.stakeholders.filter(s => s.id !== stakeholder.id)

          if (this.selectedStakeholder && this.selectedStakeholder.id === stakeholder.id) {
            this.selectedStakeholder = null
            this.showStakeholderDetail = false
          }
        } catch (error) {
          console.error('Error deleting stakeholder:', error)
        }
      }
    },

    async exportMap() {
      try {
        // Implementation will depend on export format requirements (CSV, PNG, etc.)
        // For image export, can use html2canvas or similar library
        alert('Export functionality will be implemented based on required format')
      } catch (error) {
        console.error('Error exporting map:', error)
      }
    }
  }
}
</script>

<style scoped>
.stakeholder-map {
  padding: 20px;
}

.map-controls {
  margin-bottom: 20px;
}

.map-container {
  min-height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
  background-color: #f9f9f9;
}

.no-map, .no-stakeholders {
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

/* Matrix View Styling */
.matrix-view {
  width: 100%;
  height: 100%;
}

.matrix-container {
  position: relative;
  width: 100%;
  height: 600px;
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
}

.quadrant-label {
  position: absolute;
  font-size: 12px;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.6);
  z-index: 1;
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

.x-axis-label {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
}

.y-axis-label {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%) rotate(-90deg);
  font-weight: bold;
}

.x-axis-divider {
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
  top: 50%;
}

.y-axis-divider {
  position: absolute;
  height: 100%;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.12);
  left: 50%;
}

.stakeholder-plot {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
  transition: all 0.3s ease;
}

.stakeholder-plot.selected .plot-circle {
  border: 2px solid black;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
}

.plot-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.3s ease;
  cursor: pointer;
}

.plot-circle:hover {
  transform: scale(1.2);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}

/* List View Styling */
.list-view {
  width: 100%;
}
</style>
