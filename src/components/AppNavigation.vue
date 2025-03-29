<v-list-item
  v-if="user"
  prepend-icon="mdi-account-cog"
  title="Settings"
  to="/settings"
></v-list-item>

<v-list-item
  v-if="user && isAdmin"
  prepend-icon="mdi-shield-account"
  title="Admin Settings"
  to="/admin/settings"
></v-list-item>

<v-list-item
  v-if="user"
  prepend-icon="mdi-logout"
  title="Logout"
  @click="logout"
></v-list-item>

<script>
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useUserStore } from '../stores/user'
import { mapState } from 'pinia'

export default {
  name: 'AppNavigation',

  data() {
    return {
      drawer: false,
      userProfile: null,
      isAdminUser: false
    }
  },

  computed: {
    ...mapState(useUserStore, ['user']),

    isAdmin() {
      return this.isAdminUser
    }
  },

  watch: {
    user: {
      immediate: true,
      handler(newUser) {
        if (newUser) {
          this.checkAdminStatus()
        } else {
          this.isAdminUser = false
        }
      }
    }
  },

  methods: {
    async logout() {
      try {
        await signOut(auth)
        this.$router.push('/login')
      } catch (error) {
        console.error('Error signing out:', error)
      }
    },

    async checkAdminStatus() {
      if (!this.user) return

      try {
        const userDoc = await getDoc(doc(db, 'users', this.user.uid))
        if (userDoc.exists()) {
          this.isAdminUser = userDoc.data().isAdmin === true
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      }
    }
  }
}
</script>
