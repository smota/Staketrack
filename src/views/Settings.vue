<template>
  <div class="settings">
    <h1>Settings</h1>

    <v-tabs
      v-model="activeTab"
      color="primary"
      align-tabs="center"
      class="mb-6"
    >
      <v-tab value="account">
        Account
      </v-tab>
      <v-tab value="appearance">
        Appearance
      </v-tab>
      <v-tab value="data">
        Data Management
      </v-tab>
      <v-tab value="notifications">
        Notifications
      </v-tab>
      <v-tab value="about">
        About
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="settings-container">
      <!-- Account Settings Tab -->
      <v-window-item value="account">
        <v-card flat>
          <v-card-title>Account Settings</v-card-title>
          <v-card-subtitle>Manage your account details and preferences</v-card-subtitle>

          <v-card-text>
            <v-alert v-if="!isAuthenticated" type="info" variant="tonal">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="mb-0">
                    <strong>Not logged in.</strong> Sign in to access all features and sync your data across devices.
                  </p>
                </div>
                <v-btn color="primary" to="/auth">
                  Sign In
                </v-btn>
              </div>
            </v-alert>

            <div v-else>
              <v-list-item>
                <template #prepend>
                  <v-avatar color="primary" size="48">
                    <span v-if="!currentUser.photoURL" class="text-h5 text-uppercase">{{ getUserInitials() }}</span>
                    <v-img v-else :src="currentUser.photoURL" alt="User Avatar" />
                  </v-avatar>
                </template>
                <v-list-item-title>{{ currentUser.displayName || currentUser.email }}</v-list-item-title>
                <v-list-item-subtitle>{{ currentUser.email }}</v-list-item-subtitle>
              </v-list-item>

              <v-divider class="my-4" />

              <v-form ref="profileForm" v-model="profileFormValid" @submit.prevent="updateProfile">
                <v-text-field
                  v-model="profileForm.displayName"
                  label="Display Name"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Name is required']"
                  class="mb-3"
                />

                <v-file-input
                  v-model="profileForm.photoFile"
                  label="Profile Picture"
                  variant="outlined"
                  density="comfortable"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  class="mb-3"
                />

                <v-row class="mt-4">
                  <v-col>
                    <v-btn
                      color="primary"
                      type="submit"
                      :loading="updating"
                      :disabled="!profileFormValid"
                    >
                      Update Profile
                    </v-btn>
                  </v-col>
                </v-row>
              </v-form>

              <v-divider class="my-4" />

              <v-row>
                <v-col>
                  <v-btn color="error" @click="showSignOutDialog = true">
                    Sign Out
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Appearance Settings Tab -->
      <v-window-item value="appearance">
        <v-card flat>
          <v-card-title>Appearance Settings</v-card-title>
          <v-card-subtitle>Customize the look and feel of the application</v-card-subtitle>

          <v-card-text>
            <v-list>
              <!-- Theme Mode -->
              <v-list-subheader>Theme</v-list-subheader>
              <v-list-item>
                <template #prepend>
                  <v-icon :color="themeMode === 'light' ? 'amber-darken-2' : 'blue-darken-3'">
                    {{ themeMode === 'light' ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}
                  </v-icon>
                </template>
                <v-list-item-title>Theme Mode</v-list-item-title>
                <template #append>
                  <v-switch
                    v-model="themeMode"
                    :true-value="'dark'"
                    :false-value="'light'"
                    color="primary"
                    hide-details
                    inset
                  />
                </template>
              </v-list-item>

              <!-- Matrix settings -->
              <v-divider class="my-3" />
              <v-list-subheader>Stakeholder Matrix</v-list-subheader>

              <!-- Matrix Label Visibility -->
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-label</v-icon>
                </template>
                <v-list-item-title>Show Quadrant Labels</v-list-item-title>
                <template #append>
                  <v-switch
                    v-model="matrixSettings.showLabels"
                    color="primary"
                    hide-details
                    inset
                  />
                </template>
              </v-list-item>

              <!-- Stakeholder Name Visibility -->
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-card-text</v-icon>
                </template>
                <v-list-item-title>Show Stakeholder Names</v-list-item-title>
                <template #append>
                  <v-switch
                    v-model="matrixSettings.showNames"
                    color="primary"
                    hide-details
                    inset
                  />
                </template>
              </v-list-item>

              <!-- Matrix Thresholds -->
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-axis-arrow</v-icon>
                </template>
                <v-list-item-title>
                  Influence Threshold: {{ matrixSettings.influenceThreshold }}
                </v-list-item-title>
                <template #append>
                  <v-slider
                    v-model="matrixSettings.influenceThreshold"
                    min="1"
                    max="10"
                    step="0.5"
                    thumb-label
                    class="w-25"
                  />
                </template>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-axis-arrow</v-icon>
                </template>
                <v-list-item-title>
                  Impact Threshold: {{ matrixSettings.impactThreshold }}
                </v-list-item-title>
                <template #append>
                  <v-slider
                    v-model="matrixSettings.impactThreshold"
                    min="1"
                    max="10"
                    step="0.5"
                    thumb-label
                    class="w-25"
                  />
                </template>
              </v-list-item>
            </v-list>

            <v-row class="mt-4">
              <v-col>
                <v-btn color="primary" :loading="updatingAppearance" @click="saveAppearanceSettings">
                  Save Appearance Settings
                </v-btn>
                <v-btn class="ml-2" variant="text" @click="resetDefaultAppearance">
                  Reset to Default
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Data Management Tab -->
      <v-window-item value="data">
        <v-card flat>
          <v-card-title>Data Management</v-card-title>
          <v-card-subtitle>Import, export, and manage your data</v-card-subtitle>

          <v-card-text>
            <v-expansion-panels variant="accordion">
              <!-- Export Data -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">
                      mdi-export
                    </v-icon>
                    Export Data
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p class="mb-4">
                    Export all your stakeholder maps and data for backup or transfer.
                  </p>

                  <v-checkbox
                    v-model="exportOptions.includeStakeholders"
                    label="Include Stakeholders"
                    hide-details
                  />

                  <v-checkbox
                    v-model="exportOptions.includeInteractions"
                    label="Include Interaction History"
                    hide-details
                    class="mt-2"
                  />

                  <v-checkbox
                    v-model="exportOptions.includeDocuments"
                    label="Include Documents & Notes"
                    hide-details
                    class="mt-2"
                  />

                  <v-row class="mt-4">
                    <v-col>
                      <v-btn color="primary" :loading="exporting" @click="exportData">
                        Export Data
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Import Data -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">
                      mdi-import
                    </v-icon>
                    Import Data
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p class="mb-4">
                    Import stakeholder maps and data from a previously exported file.
                  </p>

                  <v-file-input
                    v-model="importFile"
                    label="Select Import File"
                    variant="outlined"
                    density="comfortable"
                    accept=".json"
                    prepend-icon="mdi-file-import"
                  />

                  <v-radio-group v-model="importOptions.conflictResolution">
                    <template #label>
                      <div>When conflicts are found:</div>
                    </template>
                    <v-radio value="keep" label="Keep existing data" />
                    <v-radio value="replace" label="Replace with imported data" />
                    <v-radio value="merge" label="Merge data (keep both versions)" />
                  </v-radio-group>

                  <v-row class="mt-4">
                    <v-col>
                      <v-btn
                        color="primary"
                        :loading="importing"
                        :disabled="!importFile"
                        @click="importData"
                      >
                        Import Data
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Data Cleanup -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <v-icon color="error" class="mr-2">
                      mdi-delete-sweep
                    </v-icon>
                    Data Cleanup
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-alert type="warning" variant="tonal" class="mb-4">
                    Caution: These actions cannot be undone. Please export your data first if you want to keep a backup.
                  </v-alert>

                  <v-row>
                    <v-col>
                      <v-btn color="error" variant="outlined" @click="showClearLocalDataDialog = true">
                        Clear Local Data
                      </v-btn>
                      <div class="text-caption mt-1">
                        Removes all data stored in your browser.
                      </div>
                    </v-col>
                  </v-row>

                  <v-row v-if="isAuthenticated" class="mt-4">
                    <v-col>
                      <v-btn color="error" variant="outlined" @click="showClearCloudDataDialog = true">
                        Clear Cloud Data
                      </v-btn>
                      <div class="text-caption mt-1">
                        Removes all data stored in your cloud account.
                      </div>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Notifications Tab -->
      <v-window-item value="notifications">
        <v-card flat>
          <v-card-title>Notification Settings</v-card-title>
          <v-card-subtitle>Manage your notification preferences</v-card-subtitle>

          <v-card-text>
            <v-list>
              <v-list-subheader>Email Notifications</v-list-subheader>

              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-calendar-check</v-icon>
                </template>
                <v-list-item-title>Upcoming Stakeholder Interactions</v-list-item-title>
                <template #append>
                  <v-switch
                    v-model="notificationSettings.upcomingInteractions"
                    color="primary"
                    hide-details
                    inset
                  />
                </template>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-share-variant</v-icon>
                </template>
                <v-list-item-title>Map Sharing</v-list-item-title>
                <template #append>
                  <v-switch
                    v-model="notificationSettings.mapSharing"
                    color="primary"
                    hide-details
                    inset
                  />
                </template>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-update</v-icon>
                </template>
                <v-list-item-title>Application Updates</v-list-item-title>
                <template #append>
                  <v-switch
                    v-model="notificationSettings.appUpdates"
                    color="primary"
                    hide-details
                    inset
                  />
                </template>
              </v-list-item>

              <v-divider class="my-3" />
              <v-list-subheader>In-App Notifications</v-list-subheader>

              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-bell</v-icon>
                </template>
                <v-list-item-title>Enable In-App Notifications</v-list-item-title>
                <template #append>
                  <v-switch
                    v-model="notificationSettings.inAppEnabled"
                    color="primary"
                    hide-details
                    inset
                  />
                </template>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-bell-ring</v-icon>
                </template>
                <v-list-item-title>Interaction Reminders</v-list-item-title>
                <template #append>
                  <v-switch
                    v-model="notificationSettings.interactionReminders"
                    color="primary"
                    hide-details
                    inset
                    :disabled="!notificationSettings.inAppEnabled"
                  />
                </template>
              </v-list-item>
            </v-list>

            <v-row class="mt-4">
              <v-col>
                <v-btn color="primary" :loading="updatingNotifications" @click="saveNotificationSettings">
                  Save Notification Settings
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- About Tab -->
      <v-window-item value="about">
        <v-card flat>
          <v-card-title>About StakeTrack</v-card-title>

          <v-card-text>
            <div class="text-center mb-6">
              <v-avatar size="120" class="app-logo mb-4">
                <v-img src="/img/logo.png" alt="StakeTrack Logo" />
              </v-avatar>
              <h2 class="text-h4 mb-1">
                StakeTrack
              </h2>
              <p class="text-subtitle-1">
                Version {{ appVersion }}
              </p>
            </div>

            <v-divider class="mb-4" />

            <p class="mb-4">
              StakeTrack is a stakeholder management application that helps you track, visualize,
              and manage relationships with your stakeholders.
            </p>

            <p class="mb-6">
              Built with <v-icon color="red" size="small">
                mdi-heart
              </v-icon> using Vue.js and Firebase.
            </p>

            <v-row justify="center" class="mb-6">
              <v-col cols="12" sm="6" md="4">
                <v-card variant="outlined">
                  <v-card-title class="justify-center">
                    Support
                  </v-card-title>
                  <v-card-text class="text-center">
                    <p>Need help? Contact our support team.</p>
                    <v-btn color="primary" variant="text" href="mailto:support@staketrack.app">
                      <v-icon left>
                        mdi-email
                      </v-icon>
                      Contact Support
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <v-card variant="outlined">
                  <v-card-title class="justify-center">
                    Documentation
                  </v-card-title>
                  <v-card-text class="text-center">
                    <p>View our documentation and tutorials.</p>
                    <v-btn
                      color="primary"
                      variant="text"
                      href="https://docs.staketrack.app"
                      target="_blank"
                    >
                      <v-icon left>
                        mdi-book-open-variant
                      </v-icon>
                      View Docs
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="mb-4" />

            <div class="text-center">
              <p class="text-caption">
                &copy; {{ currentYear }} StakeTrack. All rights reserved.
              </p>
              <div class="mt-2">
                <v-btn
                  size="small"
                  variant="text"
                  href="/terms"
                  target="_blank"
                >
                  Terms of Service
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  href="/privacy"
                  target="_blank"
                >
                  Privacy Policy
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Dialogs -->
    <!-- Sign Out Confirmation Dialog -->
    <v-dialog v-model="showSignOutDialog" max-width="400px">
      <v-card>
        <v-card-title>Sign Out?</v-card-title>
        <v-card-text>
          Are you sure you want to sign out? Your data will remain saved and accessible when you sign back in.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="showSignOutDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" @click="signOut">
            Sign Out
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Clear Local Data Dialog -->
    <v-dialog v-model="showClearLocalDataDialog" max-width="400px">
      <v-card>
        <v-card-title>Clear Local Data?</v-card-title>
        <v-card-text>
          This will delete all data stored in your browser. This action cannot be undone.
          <template v-if="isAuthenticated">
            <p class="mt-2">
              Your cloud data will remain unaffected.
            </p>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="showClearLocalDataDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" @click="clearLocalData">
            Clear Local Data
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Clear Cloud Data Dialog -->
    <v-dialog v-model="showClearCloudDataDialog" max-width="400px">
      <v-card>
        <v-card-title>Clear Cloud Data?</v-card-title>
        <v-card-text>
          This will delete all data stored in your cloud account. This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="showClearCloudDataDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" @click="clearCloudData">
            Clear Cloud Data
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { authService } from '@/services/authService'
import { localStorageService } from '@/services/localStorageService'
import { settingsService } from '@/services/settingsService'
import { dataService } from '@/services/dataService'
import { appConfig } from '@/config'

export default {
  name: 'Settings',

  data() {
    return {
      activeTab: 'account',

      // Account settings
      isAuthenticated: false,
      currentUser: null,
      updating: false,
      profileFormValid: false,
      profileForm: {
        displayName: '',
        photoFile: null
      },
      showSignOutDialog: false,

      // Appearance settings
      themeMode: 'light',
      matrixSettings: {
        showLabels: true,
        showNames: false,
        influenceThreshold: 5.5,
        impactThreshold: 5.5
      },
      updatingAppearance: false,

      // Data management
      exportOptions: {
        includeStakeholders: true,
        includeInteractions: true,
        includeDocuments: true
      },
      importFile: null,
      importOptions: {
        conflictResolution: 'merge'
      },
      exporting: false,
      importing: false,
      showClearLocalDataDialog: false,
      showClearCloudDataDialog: false,

      // Notification settings
      notificationSettings: {
        upcomingInteractions: true,
        mapSharing: true,
        appUpdates: true,
        inAppEnabled: true,
        interactionReminders: true
      },
      updatingNotifications: false,

      // About info
      appVersion: appConfig.version || '1.0.0',
      currentYear: new Date().getFullYear()
    }
  },

  async created() {
    // Check authentication status
    this.isAuthenticated = authService.isAuthenticated()
    if (this.isAuthenticated) {
      this.currentUser = authService.getCurrentUser()
      this.profileForm.displayName = this.currentUser.displayName || ''
    }

    // Load settings from storage
    await this.loadSettings()
  },

  methods: {
    // Account methods
    getUserInitials() {
      if (!this.currentUser || !this.currentUser.displayName) {
        return '?'
      }

      const names = this.currentUser.displayName.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }

      return names[0][0].toUpperCase()
    },

    async updateProfile() {
      if (!this.profileFormValid) return

      try {
        this.updating = true

        // Update profile in Firebase Auth
        await authService.updateProfile({
          displayName: this.profileForm.displayName,
          photoFile: this.profileForm.photoFile?.[0] || null
        })

        // Refresh current user
        this.currentUser = authService.getCurrentUser()

        // Clear file input
        this.profileForm.photoFile = null

        // Show success message
        this.$emit('showSnackbar', {
          text: 'Profile updated successfully',
          color: 'success'
        })
      } catch (error) {
        console.error('Error updating profile:', error)
        this.$emit('showSnackbar', {
          text: 'Error updating profile: ' + error.message,
          color: 'error'
        })
      } finally {
        this.updating = false
      }
    },

    async signOut() {
      try {
        await authService.signOut()
        this.showSignOutDialog = false
        this.isAuthenticated = false
        this.currentUser = null

        // Redirect to auth page
        this.$router.push('/auth')
      } catch (error) {
        console.error('Error signing out:', error)
      }
    },

    // Settings methods
    async loadSettings() {
      try {
        const settings = await settingsService.getSettings()

        // Apply appearance settings
        if (settings.appearance) {
          this.themeMode = settings.appearance.themeMode || 'light'

          if (settings.appearance.matrixSettings) {
            this.matrixSettings = {
              ...this.matrixSettings,
              ...settings.appearance.matrixSettings
            }
          }
        }

        // Apply notification settings
        if (settings.notifications) {
          this.notificationSettings = {
            ...this.notificationSettings,
            ...settings.notifications
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    },

    async saveAppearanceSettings() {
      try {
        this.updatingAppearance = true

        await settingsService.updateSettings({
          appearance: {
            themeMode: this.themeMode,
            matrixSettings: this.matrixSettings
          }
        })

        // Apply theme change
        this.$vuetify.theme.global.name = this.themeMode

        this.$emit('showSnackbar', {
          text: 'Appearance settings saved',
          color: 'success'
        })
      } catch (error) {
        console.error('Error saving appearance settings:', error)
        this.$emit('showSnackbar', {
          text: 'Error saving settings: ' + error.message,
          color: 'error'
        })
      } finally {
        this.updatingAppearance = false
      }
    },

    resetDefaultAppearance() {
      this.themeMode = 'light'
      this.matrixSettings = {
        showLabels: true,
        showNames: false,
        influenceThreshold: 5.5,
        impactThreshold: 5.5
      }
    },

    async saveNotificationSettings() {
      try {
        this.updatingNotifications = true

        await settingsService.updateSettings({
          notifications: this.notificationSettings
        })

        this.$emit('showSnackbar', {
          text: 'Notification settings saved',
          color: 'success'
        })
      } catch (error) {
        console.error('Error saving notification settings:', error)
        this.$emit('showSnackbar', {
          text: 'Error saving settings: ' + error.message,
          color: 'error'
        })
      } finally {
        this.updatingNotifications = false
      }
    },

    // Data management methods
    async exportData() {
      try {
        this.exporting = true

        const exportData = await dataService.exportData({
          includeStakeholders: this.exportOptions.includeStakeholders,
          includeInteractions: this.exportOptions.includeInteractions,
          includeDocuments: this.exportOptions.includeDocuments
        })

        // Create and download a file
        const dataStr = JSON.stringify(exportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `staketrack_export_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        this.$emit('showSnackbar', {
          text: 'Data exported successfully',
          color: 'success'
        })
      } catch (error) {
        console.error('Error exporting data:', error)
        this.$emit('showSnackbar', {
          text: 'Error exporting data: ' + error.message,
          color: 'error'
        })
      } finally {
        this.exporting = false
      }
    },

    async importData() {
      if (!this.importFile) return

      try {
        this.importing = true

        const fileReader = new FileReader()

        fileReader.onload = async (event) => {
          try {
            const jsonData = JSON.parse(event.target.result)

            await dataService.importData({
              data: jsonData,
              conflictResolution: this.importOptions.conflictResolution
            })

            this.$emit('showSnackbar', {
              text: 'Data imported successfully',
              color: 'success'
            })

            // Reset import form
            this.importFile = null
          } catch (parseError) {
            console.error('Error parsing import data:', parseError)
            this.$emit('showSnackbar', {
              text: 'Invalid import file format',
              color: 'error'
            })
          } finally {
            this.importing = false
          }
        }

        fileReader.onerror = () => {
          this.importing = false
          this.$emit('showSnackbar', {
            text: 'Error reading import file',
            color: 'error'
          })
        }

        fileReader.readAsText(this.importFile[0])
      } catch (error) {
        console.error('Error importing data:', error)
        this.$emit('showSnackbar', {
          text: 'Error importing data: ' + error.message,
          color: 'error'
        })
        this.importing = false
      }
    },

    async clearLocalData() {
      try {
        await localStorageService.clearAll()

        this.showClearLocalDataDialog = false

        this.$emit('showSnackbar', {
          text: 'Local data cleared successfully',
          color: 'success'
        })
      } catch (error) {
        console.error('Error clearing local data:', error)
        this.$emit('showSnackbar', {
          text: 'Error clearing data: ' + error.message,
          color: 'error'
        })
      }
    },

    async clearCloudData() {
      if (!this.isAuthenticated) return

      try {
        await dataService.clearCloudData()

        this.showClearCloudDataDialog = false

        this.$emit('showSnackbar', {
          text: 'Cloud data cleared successfully',
          color: 'success'
        })
      } catch (error) {
        console.error('Error clearing cloud data:', error)
        this.$emit('showSnackbar', {
          text: 'Error clearing data: ' + error.message,
          color: 'error'
        })
      }
    }
  }
}
</script>

<style scoped>
.settings {
  padding: 20px;
}

.settings-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
  background-color: white;
}

.app-logo {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 20px;
}

/* Make sliders narrower in list items */
:deep(.v-slider.w-25) {
  max-width: 200px;
}
</style>
