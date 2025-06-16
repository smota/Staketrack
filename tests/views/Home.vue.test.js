import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Home from '@/views/Home.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createRouter, createWebHistory } from 'vue-router'

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb(null) // not logged in
    return () => { } // return an unsubscribe function
  })
}))

jest.mock('@/firebase', () => ({
  auth: jest.fn()
}))

const vuetify = createVuetify({ components, directives })

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', component: { template: '<div>login</div>' } },
  { path: '/dashboard', component: { template: '<div>dashboard</div>' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

describe('Home.vue', () => {
  let wrapper

  beforeEach(async () => {
    router.push('/')
    await router.isReady()
    wrapper = mount(Home, {
      global: {
        plugins: [vuetify, router]
      }
    })
    await flushPromises()
  })

  it('renders a welcome message', () => {
    expect(wrapper.text()).toContain('Welcome to StakeTrack')
  })

  it('renders get started button when not logged in', async () => {
    await flushPromises()
    const button = wrapper.find('[data-testid="get-started-btn"]')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Get Started')
  })
})
