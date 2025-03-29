import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

// View components
const Home = () => import('../views/Home.vue')
const Login = () => import('../views/Login.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const StakeholderMap = () => import('../views/StakeholderMap.vue')
const StakeholderDetail = () => import('../views/StakeholderDetail.vue')
const Settings = () => import('../views/Settings.vue')
const NotFound = () => import('../views/NotFound.vue')
const AdminSettings = () => import('../views/AdminSettings.vue')

// Routes configuration
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/maps/:id',
    name: 'StakeholderMap',
    component: StakeholderMap,
    props: true,
    meta: { requiresAuth: false }
  },
  {
    path: '/stakeholders/:id',
    name: 'StakeholderDetail',
    component: StakeholderDetail,
    props: true,
    meta: { requiresAuth: false }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: AdminSettings,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL || '/'),
  routes
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const auth = getAuth()
  const currentUser = auth.currentUser

  if (requiresAuth && !currentUser) {
    next('/login')
  } else if (requiresAdmin) {
    // Check if user is admin
    if (!currentUser) {
      next('/login')
    } else {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        next() // User is admin, allow access
      } else {
        next('/') // Not admin, redirect to home
      }
    }
  } else {
    next()
  }
})

export default router
