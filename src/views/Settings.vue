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
          <v-card-subtitle>Manage your data</v-card-subtitle>

          <v-card-text>
            <v-row>
              <!-- Clear Local Storage -->
              <v-col cols="12">
                <v-card variant="outlined" class="mb-3">
                  <v-card-title class="text-subtitle-1">
                    <v-icon start color="warning">
                      mdi-delete-sweep
                    </v-icon>
                    Clear Local Storage
                  </v-card-title>
                  <v-card-text>
                    <p class="mb-3">
                      Clear locally stored application data and preferences.
                      This does not affect cloud-saved stakeholder data.
                    </p>
                    <v-btn
                      color="warning"
                      :loading="clearingLocalData"
                      @click="clearLocalData"
                    >
                      Clear Local Data
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Account Data -->
              <v-col cols="12">
                <v-card variant="outlined" class="mb-3">
                  <v-card-title class="text-subtitle-1">
                    <v-icon start color="error">
                      mdi-account-remove
                    </v-icon>
                    Account Data
                  </v-card-title>
                  <v-card-text>
                    <p class="mb-3">
                      Remove all your stakeholder data and account information.
                      Caution: This action cannot be undone.
                    </p>
                    <v-btn
                      color="error"
                      variant="outlined"
                      :loading="deletingAccount"
                      @click="confirmDeleteAccount"
                    >
                      Delete Account & Data
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
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

    <!-- Delete Account Confirmation Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="400px">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="confirmDialog.show = false">
            Cancel
          </v-btn>
          <v-btn color="error" @click="confirmDialog.action">
            {{ confirmDialog.confirmText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/firebase'
import { authService } from '@/services/authService'
import { localStorageService } from '@/services/localStorageService'
import { settingsService } from '@/services/settingsService'
import config from '@/config'

export default {
  name: 'SettingsView',
  data() {
    return {
      // User and auth state
      currentUser: null,
      isAuthenticated: false,

      // Form states
      profileFormValid: true,
      profileForm: {
        displayName: '',
        photoFile: null
      },
      updating: false,
      showSignOutDialog: false,
      showDeleteAccountDialog: false,

      // Export state
      exporting: false,
      exportOptions: {
        includeStakeholders: true,
        includeInteractions: true,
        includeDocuments: true
      },

      // Import state
      importing: false,
      importFile: null,
      importOptions: {
        replaceExisting: false,
        includeStakeholders: true,
        includeInteractions: true,
        includeDocuments: true
      },

      // Theme settings
      themeMode: 'light',
      updatingAppearance: false,

      // Matrix settings
      matrixSettings: {
        showLabels: true,
        showNames: false,
        influenceThreshold: 5.5,
        impactThreshold: 5.5
      },

      // Clear data
      clearingData: false,
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
      appVersion: config.version || '1.0.0',
      currentYear: new Date().getFullYear(),

      // Delete account
      deletingAccount: false,
      confirmDialog: {
        show: false,
        title: '',
        message: '',
        confirmText: '',
        confirmColor: '',
        action: null
      },

      // Local data
      clearingLocalData: false
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

    // Data Management Methods
    async clearLocalData() {
      try {
        this.clearingLocalData = true
        await localStorageService.clearAll()
        this.showNotification({
          type: 'success',
          text: 'Local data cleared successfully'
        })
      } catch (error) {
        console.error('Error clearing local data:', error)
        this.showNotification({
          type: 'error',
          text: 'Error clearing local data: ' + error.message
        })
      } finally {
        this.clearingLocalData = false
      }
    },

    confirmDeleteAccount() {
      this.confirmDialog = {
        show: true,
        title: 'Delete Account & Data',
        message: 'This will permanently delete your account and all associated data. This action cannot be undone. Are you sure you want to continue?',
        confirmText: 'Delete Forever',
        confirmColor: 'error',
        action: this.deleteAccount
      }
    },

    async deleteAccount() {
      try {
        this.deletingAccount = true

        // Delete user account (Firebase handles account removal)
        await authService.deleteAccount()

        this.$router.push('/login')
      } catch (error) {
        console.error('Error deleting account:', error)
        this.showNotification({
          type: 'error',
          text: 'Error deleting account: ' + error.message
        })
        this.deletingAccount = false
      }
    },

    // Notification methods
    showNotification(notification) {
      this.$emit('showSnackbar', notification)
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
