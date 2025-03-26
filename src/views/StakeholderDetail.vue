<template>
  <div class="stakeholder-detail">
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="primary" />
      <p>Loading stakeholder details...</p>
    </div>

    <div v-else-if="!stakeholder" class="not-found-container">
      <h1>Stakeholder Not Found</h1>
      <p>The requested stakeholder could not be found or you don't have permission to view it.</p>
      <v-btn color="primary" @click="navigateBack">
        <v-icon left>
          mdi-arrow-left
        </v-icon>
        Go Back
      </v-btn>
    </div>

    <div v-else class="stakeholder-content">
      <!-- Header with actions -->
      <div class="header-container">
        <div class="header-left">
          <h1>{{ stakeholder.name }}</h1>
          <v-chip :color="getCategoryColor(stakeholder.category)" class="ml-2">
            {{ getCategoryLabel(stakeholder.category) }}
          </v-chip>
        </div>
        <div class="header-actions">
          <v-btn color="primary" class="mr-2" @click="editStakeholder">
            <v-icon left>
              mdi-pencil
            </v-icon>
            Edit
          </v-btn>
          <v-btn color="error" @click="confirmDelete">
            <v-icon left>
              mdi-delete
            </v-icon>
            Delete
          </v-btn>
        </div>
      </div>

      <!-- Main content -->
      <v-row>
        <!-- Left column: Stakeholder details -->
        <v-col cols="12" md="7">
          <v-card class="mb-4">
            <v-card-title>
              <v-icon left>
                mdi-account-details
              </v-icon>
              Stakeholder Profile
            </v-card-title>
            <v-card-text>
              <v-row>
                <!-- Key metrics with visual indicators -->
                <v-col cols="12" class="metrics-container">
                  <div class="metric-card">
                    <div class="metric-label">
                      Influence
                    </div>
                    <v-rating
                      :model-value="stakeholder.influence"
                      readonly
                      color="primary"
                      density="compact"
                      length="10"
                    />
                    <div class="metric-value">
                      {{ stakeholder.influence }}/10
                    </div>
                  </div>

                  <div class="metric-card">
                    <div class="metric-label">
                      Impact
                    </div>
                    <v-rating
                      :model-value="stakeholder.impact"
                      readonly
                      color="secondary"
                      density="compact"
                      length="10"
                    />
                    <div class="metric-value">
                      {{ stakeholder.impact }}/10
                    </div>
                  </div>

                  <div class="metric-card">
                    <div class="metric-label">
                      Relationship
                    </div>
                    <v-rating
                      :model-value="stakeholder.relationship"
                      readonly
                      color="info"
                      density="compact"
                      length="10"
                    />
                    <div class="metric-value">
                      {{ stakeholder.relationship }}/10
                    </div>
                  </div>
                </v-col>

                <!-- Textual information -->
                <v-col v-if="stakeholder.interests" cols="12" sm="6">
                  <div class="info-section">
                    <div class="info-label">
                      Interests
                    </div>
                    <div class="info-content">
                      {{ stakeholder.interests }}
                    </div>
                  </div>
                </v-col>

                <v-col v-if="stakeholder.contribution" cols="12" sm="6">
                  <div class="info-section">
                    <div class="info-label">
                      Contribution
                    </div>
                    <div class="info-content">
                      {{ stakeholder.contribution }}
                    </div>
                  </div>
                </v-col>

                <v-col v-if="stakeholder.risk" cols="12" sm="6">
                  <div class="info-section">
                    <div class="info-label">
                      Risk
                    </div>
                    <div class="info-content">
                      {{ stakeholder.risk }}
                    </div>
                  </div>
                </v-col>

                <v-col v-if="stakeholder.communication" cols="12" sm="6">
                  <div class="info-section">
                    <div class="info-label">
                      Communication Style
                    </div>
                    <div class="info-content">
                      {{ stakeholder.communication }}
                    </div>
                  </div>
                </v-col>

                <v-col v-if="stakeholder.strategy" cols="12" sm="6">
                  <div class="info-section">
                    <div class="info-label">
                      Engagement Strategy
                    </div>
                    <div class="info-content">
                      {{ stakeholder.strategy }}
                    </div>
                  </div>
                </v-col>

                <v-col v-if="stakeholder.measurement" cols="12" sm="6">
                  <div class="info-section">
                    <div class="info-label">
                      Measurement Approach
                    </div>
                    <div class="info-content">
                      {{ stakeholder.measurement }}
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Position in matrix visualization -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon left>
                mdi-chart-bubble
              </v-icon>
              Matrix Position
            </v-card-title>
            <v-card-text>
              <div class="mini-matrix">
                <!-- Quadrant Labels -->
                <div class="mini-label top-right">
                  KEY PLAYERS
                </div>
                <div class="mini-label top-left">
                  MEET THEIR NEEDS
                </div>
                <div class="mini-label bottom-right">
                  KEEP SATISFIED
                </div>
                <div class="mini-label bottom-left">
                  SHOW CONSIDERATION
                </div>

                <!-- Axis Dividers -->
                <div class="mini-x-divider" />
                <div class="mini-y-divider" />

                <!-- Stakeholder Plot -->
                <div
                  class="mini-plot"
                  :style="getPlotStyles(stakeholder)"
                >
                  <div
                    class="mini-circle"
                    :style="{ backgroundColor: getCategoryColor(stakeholder.category) }"
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right column: Interactions and activities -->
        <v-col cols="12" md="5">
          <!-- Interactions history -->
          <v-card class="mb-4">
            <v-card-title class="d-flex justify-space-between">
              <div>
                <v-icon left>
                  mdi-history
                </v-icon>
                Interaction History
              </div>
              <v-btn size="small" color="primary" @click="addInteraction">
                <v-icon left>
                  mdi-plus
                </v-icon>
                Add
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="!interactions || interactions.length === 0" class="no-data-message">
                <p>No interactions recorded yet.</p>
              </div>
              <v-timeline v-else density="compact" side="end">
                <v-timeline-item
                  v-for="interaction in interactions"
                  :key="interaction.id"
                  :dot-color="getInteractionColor(interaction.type)"
                  size="small"
                >
                  <template #opposite>
                    <div class="interaction-date">
                      {{ formatDate(interaction.date) }}
                    </div>
                  </template>
                  <v-card>
                    <v-card-title class="text-subtitle-1">
                      {{ interaction.title }}
                      <v-chip size="x-small" class="ml-2" :color="getInteractionColor(interaction.type)">
                        {{ interaction.type }}
                      </v-chip>
                    </v-card-title>
                    <v-card-text>
                      <div>{{ interaction.notes }}</div>
                      <div class="interaction-actions">
                        <v-btn size="x-small" icon @click="editInteraction(interaction)">
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                          size="x-small"
                          icon
                          color="error"
                          @click="deleteInteraction(interaction)"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>

          <!-- Related documents or notes -->
          <v-card class="mb-4">
            <v-card-title class="d-flex justify-space-between">
              <div>
                <v-icon left>
                  mdi-note-text
                </v-icon>
                Documents & Notes
              </div>
              <v-btn size="small" color="primary" @click="addDocument">
                <v-icon left>
                  mdi-plus
                </v-icon>
                Add
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="!documents || documents.length === 0" class="no-data-message">
                <p>No documents or notes added yet.</p>
              </div>
              <v-list v-else density="compact">
                <v-list-item
                  v-for="doc in documents"
                  :key="doc.id"
                  :title="doc.title"
                  :subtitle="formatDate(doc.date)"
                  lines="two"
                >
                  <template #prepend>
                    <v-icon :color="getDocumentColor(doc.type)">
                      {{ getDocumentIcon(doc.type) }}
                    </v-icon>
                  </template>
                  <template #append>
                    <v-btn size="x-small" icon @click="viewDocument(doc)">
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Add/Edit Interaction Dialog -->
    <v-dialog v-model="showInteractionDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editingInteraction ? 'Edit Interaction' : 'Add Interaction' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="interactionForm">
            <v-text-field
              v-model="interactionForm.title"
              label="Title"
              required
              :rules="[v => !!v || 'Title is required']"
            />

            <v-select
              v-model="interactionForm.type"
              :items="interactionTypes"
              label="Type"
              required
              :rules="[v => !!v || 'Type is required']"
            />

            <v-text-field
              v-model="interactionForm.date"
              label="Date"
              type="date"
              required
              :rules="[v => !!v || 'Date is required']"
            />

            <v-textarea
              v-model="interactionForm.notes"
              label="Notes"
              rows="4"
              counter="1000"
              :rules="[v => !v || v.length <= 1000 || 'Notes must be less than 1000 characters']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="error" @click="showInteractionDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="saveInteraction">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Document Dialog -->
    <v-dialog v-model="showDocumentDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editingDocument ? 'Edit Document/Note' : 'Add Document/Note' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="documentForm">
            <v-text-field
              v-model="documentForm.title"
              label="Title"
              required
              :rules="[v => !!v || 'Title is required']"
            />

            <v-select
              v-model="documentForm.type"
              :items="documentTypes"
              label="Type"
              required
              :rules="[v => !!v || 'Type is required']"
            />

            <v-text-field
              v-model="documentForm.date"
              label="Date"
              type="date"
              required
              :rules="[v => !!v || 'Date is required']"
            />

            <v-textarea
              v-if="documentForm.type === 'note'"
              v-model="documentForm.content"
              label="Content"
              rows="4"
              counter="2000"
              :rules="[v => !v || v.length <= 2000 || 'Content must be less than 2000 characters']"
            />

            <v-file-input
              v-else
              v-model="documentForm.file"
              label="File"
              :rules="[v => documentForm.type !== 'file' || !!v || 'File is required']"
              accept=".pdf,.doc,.docx,.xlsx,.ppt,.pptx,.txt,.jpg,.png"
              counter
              show-size
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="error" @click="showDocumentDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="saveDocument">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete this stakeholder? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showDeleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" @click="deleteStakeholder">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapService } from '@/services/mapService'
import { stakeholderService } from '@/services/stakeholderService'
import { interactionService } from '@/services/interactionService'
import { documentService } from '@/services/documentService'
import { categoryOptions, getCategoryColor } from '@/config/categories'

export default {
  name: 'StakeholderDetail',

  data() {
    return {
      // State management
      loading: true,
      stakeholder: null,
      interactions: [],
      documents: [],
      showInteractionDialog: false,
      showDocumentDialog: false,
      showDeleteDialog: false,
      editingInteraction: null,
      editingDocument: null,

      // Form data
      interactionForm: {
        title: '',
        type: 'meeting',
        date: new Date().toISOString().substr(0, 10),
        notes: ''
      },

      documentForm: {
        title: '',
        type: 'note',
        date: new Date().toISOString().substr(0, 10),
        content: '',
        file: null
      },

      // Options for forms
      interactionTypes: [
        { title: 'Meeting', value: 'meeting' },
        { title: 'Call', value: 'call' },
        { title: 'Email', value: 'email' },
        { title: 'Social', value: 'social' },
        { title: 'Other', value: 'other' }
      ],

      documentTypes: [
        { title: 'Note', value: 'note' },
        { title: 'Document', value: 'document' },
        { title: 'Presentation', value: 'presentation' },
        { title: 'Image', value: 'image' },
        { title: 'Video', value: 'video' },
        { title: 'Other', value: 'other' }
      ]
    }
  },

  computed: {
    // Get map ID and stakeholder ID from route params
    mapId() {
      return this.$route.params.mapId
    },

    stakeholderId() {
      return this.$route.params.id
    }
  },

  async created() {
    // Load data when component is created
    await this.loadStakeholderData()
  },

  methods: {
    async loadStakeholderData() {
      try {
        this.loading = true

        // Load stakeholder details
        this.stakeholder = await stakeholderService.getStakeholder(this.mapId, this.stakeholderId)

        if (this.stakeholder) {
          // Load interactions for this stakeholder
          this.interactions = await interactionService.getInteractions(this.mapId, this.stakeholderId)

          // Load documents for this stakeholder
          this.documents = await documentService.getDocuments(this.mapId, this.stakeholderId)
        }
      } catch (error) {
        console.error('Error loading stakeholder data:', error)
        // Handle error (could show error message to user)
      } finally {
        this.loading = false
      }
    },

    // Navigation methods
    navigateBack() {
      this.$router.push(`/maps/${this.mapId}`)
    },

    // Stakeholder CRUD operations
    async editStakeholder() {
      this.$router.push(`/maps/${this.mapId}/stakeholders/${this.stakeholderId}/edit`)
    },

    confirmDelete() {
      this.showDeleteDialog = true
    },

    async deleteStakeholder() {
      try {
        await stakeholderService.deleteStakeholder(this.mapId, this.stakeholderId)
        this.showDeleteDialog = false
        this.$router.push(`/maps/${this.mapId}`)
      } catch (error) {
        console.error('Error deleting stakeholder:', error)
      }
    },

    // Interaction CRUD operations
    addInteraction() {
      this.editingInteraction = null
      this.interactionForm = {
        title: '',
        type: 'meeting',
        date: new Date().toISOString().substr(0, 10),
        notes: ''
      }
      this.showInteractionDialog = true
    },

    editInteraction(interaction) {
      this.editingInteraction = interaction
      this.interactionForm = {
        title: interaction.title,
        type: interaction.type,
        date: interaction.date,
        notes: interaction.notes
      }
      this.showInteractionDialog = true
    },

    async saveInteraction() {
      // Validate form
      const valid = await this.$refs.interactionForm.validate()

      if (!valid) {
        return
      }

      try {
        if (this.editingInteraction) {
          // Update existing interaction
          await interactionService.updateInteraction(
            this.mapId,
            this.stakeholderId,
            this.editingInteraction.id,
            this.interactionForm
          )
        } else {
          // Create new interaction
          await interactionService.addInteraction(
            this.mapId,
            this.stakeholderId,
            this.interactionForm
          )
        }

        // Reload interactions
        this.interactions = await interactionService.getInteractions(this.mapId, this.stakeholderId)
        this.showInteractionDialog = false
      } catch (error) {
        console.error('Error saving interaction:', error)
      }
    },

    async deleteInteraction(interaction) {
      if (confirm('Are you sure you want to delete this interaction?')) {
        try {
          await interactionService.deleteInteraction(
            this.mapId,
            this.stakeholderId,
            interaction.id
          )

          // Reload interactions
          this.interactions = await interactionService.getInteractions(this.mapId, this.stakeholderId)
        } catch (error) {
          console.error('Error deleting interaction:', error)
        }
      }
    },

    // Document CRUD operations
    addDocument() {
      this.editingDocument = null
      this.documentForm = {
        title: '',
        type: 'note',
        date: new Date().toISOString().substr(0, 10),
        content: '',
        file: null
      }
      this.showDocumentDialog = true
    },

    editDocument(document) {
      this.editingDocument = document
      this.documentForm = {
        title: document.title,
        type: document.type,
        date: document.date,
        content: document.content || '',
        file: null
      }
      this.showDocumentDialog = true
    },

    async saveDocument() {
      // Validate form
      const valid = await this.$refs.documentForm.validate()

      if (!valid) {
        return
      }

      try {
        if (this.editingDocument) {
          // Update existing document
          await documentService.updateDocument(
            this.mapId,
            this.stakeholderId,
            this.editingDocument.id,
            this.documentForm
          )
        } else {
          // Create new document
          await documentService.addDocument(
            this.mapId,
            this.stakeholderId,
            this.documentForm
          )
        }

        // Reload documents
        this.documents = await documentService.getDocuments(this.mapId, this.stakeholderId)
        this.showDocumentDialog = false
      } catch (error) {
        console.error('Error saving document:', error)
      }
    },

    async viewDocument(document) {
      // If it's a note, show it in a dialog
      if (document.type === 'note') {
        this.editDocument(document)
      } else {
        // Otherwise, try to download or open the file
        try {
          await documentService.getDocumentUrl(
            this.mapId,
            this.stakeholderId,
            document.id
          ).then(url => {
            window.open(url, '_blank')
          })
        } catch (error) {
          console.error('Error accessing document:', error)
        }
      }
    },

    // Utility methods
    getPlotStyles(stakeholder) {
      // Position based on influence (x) and impact (y)
      // Scale from 1-10 to percentage position (10-90% to avoid edges)
      const xPos = 10 + ((stakeholder.influence - 1) / 9) * 80
      const yPos = 90 - ((stakeholder.impact - 1) / 9) * 80 // Invert Y-axis (top = high impact)

      return {
        left: `${xPos}%`,
        top: `${yPos}%`
      }
    },

    getCategoryColor(category) {
      return getCategoryColor(category)
    },

    getCategoryLabel(categoryValue) {
      const category = categoryOptions.find(c => c.value === categoryValue)
      return category ? category.title : categoryValue
    },

    getInteractionColor(type) {
      const colors = {
        meeting: 'indigo',
        call: 'blue',
        email: 'green',
        social: 'purple',
        other: 'grey'
      }
      return colors[type] || colors.other
    },

    getDocumentColor(type) {
      const colors = {
        note: 'amber',
        document: 'blue',
        presentation: 'red',
        image: 'green',
        video: 'purple',
        other: 'grey'
      }
      return colors[type] || colors.other
    },

    getDocumentIcon(type) {
      const icons = {
        note: 'mdi-note-text',
        document: 'mdi-file-document',
        presentation: 'mdi-file-presentation-box',
        image: 'mdi-image',
        video: 'mdi-video',
        other: 'mdi-file'
      }
      return icons[type] || icons.other
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.stakeholder-detail {
  padding: 20px;
}

.loading-container, .not-found-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  text-align: center;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.metrics-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.metric-card {
  flex: 1;
  min-width: 120px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f5f5f5;
  text-align: center;
}

.metric-label {
  font-weight: bold;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 18px;
  font-weight: bold;
  margin-top: 8px;
}

.info-section {
  margin-bottom: 16px;
}

.info-label {
  font-weight: bold;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 4px;
}

.info-content {
  white-space: pre-line;
}

.interaction-date {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.interaction-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.no-data-message {
  padding: 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
}

/* Mini Matrix Styling */
.mini-matrix {
  position: relative;
  width: 100%;
  height: 200px;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.mini-label {
  position: absolute;
  font-size: 10px;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.4);
}

.mini-matrix .top-right {
  top: 10px;
  right: 10px;
}

.mini-matrix .top-left {
  top: 10px;
  left: 10px;
}

.mini-matrix .bottom-right {
  bottom: 10px;
  right: 10px;
}

.mini-matrix .bottom-left {
  bottom: 10px;
  left: 10px;
}

.mini-x-divider {
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.1);
  top: 50%;
}

.mini-y-divider {
  position: absolute;
  height: 100%;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.1);
  left: 50%;
}

.mini-plot {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.mini-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}
</style>
