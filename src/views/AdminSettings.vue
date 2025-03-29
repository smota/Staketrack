<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="headline">
            Admin Settings
            <v-spacer />
            <v-chip v-if="isAdmin" color="primary">
              Admin
            </v-chip>
            <v-chip v-else color="error">
              Not Admin
            </v-chip>
          </v-card-title>

          <!-- Admin Authentication Check -->
          <div v-if="loading" class="d-flex justify-center pa-4">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <div v-else-if="!isAdmin" class="pa-4">
            <v-alert type="error" class="mb-4">
              You don't have admin privileges to access this page.
            </v-alert>
            <v-btn color="primary" to="/">
              Return to Dashboard
            </v-btn>
          </div>

          <div v-else>
            <v-tabs v-model="activeTab">
              <v-tab value="ai-limits">
                AI Usage Limits
              </v-tab>
              <v-tab value="user-management">
                User Management
              </v-tab>
              <v-tab value="system">
                System Settings
              </v-tab>
            </v-tabs>

            <v-window v-model="activeTab">
              <!-- AI Usage Limits Tab -->
              <v-window-item value="ai-limits">
                <v-card-text>
                  <v-form @submit.prevent="saveAILimits">
                    <v-alert
                      v-if="saveSuccess"
                      type="success"
                      variant="tonal"
                      class="mb-4"
                      closable
                    >
                      AI Usage limits saved successfully.
                    </v-alert>

                    <v-alert
                      v-if="saveError"
                      type="error"
                      variant="tonal"
                      class="mb-4"
                      closable
                    >
                      Error saving AI usage limits: {{ saveError }}
                    </v-alert>

                    <h3 class="text-h5 mb-4">
                      Global AI Usage Settings
                    </h3>

                    <v-card variant="outlined" class="mb-4 pa-4">
                      <h4 class="text-subtitle-1 font-weight-bold mb-2">
                        Weekly User Limits
                      </h4>
                      <p class="text-body-2 mb-3">
                        Set the maximum number of AI recommendations a user can request per week.
                        The counter resets automatically every Sunday at midnight.
                      </p>

                      <v-slider
                        v-model="weeklyCallLimit"
                        :min="1"
                        :max="50"
                        :step="1"
                        color="primary"
                        thumb-label
                        class="mb-2"
                      >
                        <template #append>
                          <v-text-field
                            v-model="weeklyCallLimit"
                            type="number"
                            style="width: 100px"
                            density="compact"
                            variant="outlined"
                            min="1"
                            max="50"
                            hide-details
                          />
                        </template>
                      </v-slider>

                      <p class="text-caption mt-2">
                        Current Setting: {{ currentLimits.weeklyCallLimit || 'Not set (default: 10)' }}
                      </p>
                    </v-card>

                    <v-card variant="outlined" class="mb-4 pa-4">
                      <h4 class="text-subtitle-1 font-weight-bold mb-2">
                        Usage Statistics
                      </h4>
                      <p class="text-body-2 mb-3">
                        Overview of AI feature usage across the application.
                      </p>

                      <v-list density="compact">
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="primary">
                              mdi-account-group
                            </v-icon>
                          </template>
                          <v-list-item-title>Total Users Using AI Features</v-list-item-title>
                          <v-list-item-subtitle>{{ usageStats.totalUsers || 'Loading...' }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <template #prepend>
                            <v-icon color="primary">
                              mdi-counter
                            </v-icon>
                          </template>
                          <v-list-item-title>Total AI Calls This Week</v-list-item-title>
                          <v-list-item-subtitle>{{ usageStats.weeklyTotal || 'Loading...' }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <template #prepend>
                            <v-icon color="primary">
                              mdi-chart-timeline-variant
                            </v-icon>
                          </template>
                          <v-list-item-title>Total AI Calls Last 30 Days</v-list-item-title>
                          <v-list-item-subtitle>{{ usageStats.monthlyTotal || 'Loading...' }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card>

                    <h3 class="text-h5 mb-4">
                      User Exception Management
                    </h3>

                    <v-card variant="outlined" class="mb-4 pa-4">
                      <h4 class="text-subtitle-1 font-weight-bold mb-2">
                        Users with Unlimited Access
                      </h4>
                      <p class="text-body-2 mb-3">
                        Grant specific users unlimited access to AI features. These users will bypass
                        the weekly usage limits.
                      </p>

                      <v-autocomplete
                        v-model="selectedUser"
                        :items="users"
                        item-title="email"
                        item-value="id"
                        label="Select User"
                        variant="outlined"
                        clearable
                        class="mb-4"
                      />

                      <v-btn
                        color="success"
                        :disabled="!selectedUser"
                        class="mr-2"
                        @click="grantUnlimitedAccess"
                      >
                        Grant Unlimited Access
                      </v-btn>

                      <v-divider class="my-4" />

                      <h4 class="text-subtitle-1 mb-3">
                        Users with Unlimited Access
                      </h4>

                      <div v-if="unlimitedUsers.length === 0" class="text-center pa-4">
                        <v-icon color="grey" size="48">
                          mdi-account-off
                        </v-icon>
                        <p class="text-subtitle-1 mt-2">
                          No users with unlimited access yet.
                        </p>
                      </div>

                      <v-list v-else>
                        <v-list-item
                          v-for="user in unlimitedUsers"
                          :key="user.id"
                        >
                          <template #prepend>
                            <v-avatar color="primary" size="36">
                              {{ user.email.charAt(0).toUpperCase() }}
                            </v-avatar>
                          </template>

                          <v-list-item-title>{{ user.email }}</v-list-item-title>
                          <v-list-item-subtitle>{{ user.name || 'No name provided' }}</v-list-item-subtitle>

                          <template #append>
                            <v-btn
                              icon="mdi-delete"
                              variant="text"
                              density="comfortable"
                              color="error"
                              @click="revokeUnlimitedAccess(user.id)"
                            />
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-card>

                    <div class="d-flex justify-end">
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="isSaving"
                      >
                        Save Changes
                      </v-btn>
                    </div>
                  </v-form>
                </v-card-text>
              </v-window-item>

              <!-- Other tabs would go here -->
              <v-window-item value="user-management">
                <v-card-text>
                  <h3 class="text-h5 mb-4">
                    User Management
                  </h3>
                  <p>User management features will be implemented here.</p>
                </v-card-text>
              </v-window-item>

              <v-window-item value="system">
                <v-card-text>
                  <h3 class="text-h5 mb-4">
                    System Settings
                  </h3>
                  <p>System settings will be implemented here.</p>
                </v-card-text>
              </v-window-item>
            </v-window>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, runTransaction } from 'firebase/firestore'

export default {
  name: 'AdminSettings',

  data() {
    return {
      loading: true,
      isAdmin: false,
      activeTab: 'ai-limits',
      weeklyCallLimit: 10,
      currentLimits: {},
      isSaving: false,
      saveSuccess: false,
      saveError: null,
      selectedUser: null,
      users: [],
      unlimitedUsers: [],
      usageStats: {
        totalUsers: 0,
        weeklyTotal: 0,
        monthlyTotal: 0
      }
    }
  },

  mounted() {
    this.checkAdminStatus()
    this.fetchCurrentLimits()
    this.fetchUsers()
    this.fetchUsageStats()
  },

  methods: {
    checkAdminStatus() {
      const auth = getAuth()
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const db = getFirestore()
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            this.isAdmin = userDoc.data().isAdmin === true
          }
        }
        this.loading = false
      })
    },

    async fetchCurrentLimits() {
      try {
        const db = getFirestore()
        const limitsDoc = await getDoc(doc(db, 'config', 'aiLimits'))

        if (limitsDoc.exists()) {
          this.currentLimits = limitsDoc.data()
          this.weeklyCallLimit = this.currentLimits.weeklyCallLimit || 10
        }
      } catch (error) {
        console.error('Error fetching AI limits:', error)
      }
    },

    async saveAILimits() {
      this.isSaving = true
      this.saveSuccess = false
      this.saveError = null

      try {
        const db = getFirestore()
        await setDoc(doc(db, 'config', 'aiLimits'), {
          weeklyCallLimit: parseInt(this.weeklyCallLimit),
          lastUpdated: new Date()
        }, { merge: true })

        this.saveSuccess = true
        this.fetchCurrentLimits()
      } catch (error) {
        console.error('Error saving AI limits:', error)
        this.saveError = error.message
      } finally {
        this.isSaving = false
      }
    },

    async fetchUsers() {
      try {
        const db = getFirestore()
        const usersSnapshot = await getDocs(collection(db, 'users'))

        this.users = []
        usersSnapshot.forEach(doc => {
          const userData = doc.data()
          this.users.push({
            id: doc.id,
            email: userData.email,
            name: userData.displayName,
            isUnlimited: userData.unlimitedAiAccess === true
          })
        })

        this.unlimitedUsers = this.users.filter(user => user.isUnlimited)
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    },

    async grantUnlimitedAccess() {
      if (!this.selectedUser) return

      try {
        const db = getFirestore()
        await updateDoc(doc(db, 'users', this.selectedUser), {
          unlimitedAiAccess: true,
          updatedAt: new Date()
        })

        this.fetchUsers()
        this.selectedUser = null
      } catch (error) {
        console.error('Error granting unlimited access:', error)
      }
    },

    async revokeUnlimitedAccess(userId) {
      try {
        const db = getFirestore()
        await updateDoc(doc(db, 'users', userId), {
          unlimitedAiAccess: false,
          updatedAt: new Date()
        })

        this.fetchUsers()
      } catch (error) {
        console.error('Error revoking unlimited access:', error)
      }
    },

    async fetchUsageStats() {
      try {
        const db = getFirestore()

        // Get current week bounds
        const now = new Date()
        const day = now.getDay() // 0 for Sunday
        const diff = now.getDate() - day
        const startOfWeek = new Date(now)
        startOfWeek.setDate(diff)
        startOfWeek.setHours(0, 0, 0, 0)

        // Get start of month
        const startOfMonth = new Date(now)
        startOfMonth.setDate(now.getDate() - 30)

        // Count weekly usage
        const weeklySnapshot = await getDocs(
          query(collection(db, 'aiUsage'), where('timestamp', '>=', startOfWeek))
        )
        this.usageStats.weeklyTotal = weeklySnapshot.size

        // Count monthly usage
        const monthlySnapshot = await getDocs(
          query(collection(db, 'aiUsage'), where('timestamp', '>=', startOfMonth))
        )
        this.usageStats.monthlyTotal = monthlySnapshot.size

        // Count unique users
        const uniqueUsers = new Set()
        monthlySnapshot.forEach(doc => {
          uniqueUsers.add(doc.data().userId)
        })
        this.usageStats.totalUsers = uniqueUsers.size

      } catch (error) {
        console.error('Error fetching usage stats:', error)
      }
    }
  }
}
</script>

<style scoped>
.v-card-text {
  padding: 16px;
}
</style>
