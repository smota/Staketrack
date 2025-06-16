import { useNotificationStore } from '@/stores/notificationStore'

describe('Notification Store', () => {
  let store

  beforeEach(() => {
    // Reset modules to get a fresh store for each test
    jest.resetModules()
    const { useNotificationStore: freshStore } = require('@/stores/notificationStore')
    store = freshStore()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows a notification', () => {
    store.showNotification({ message: 'Hello', type: 'success' })
    expect(store.notifications.value.length).toBe(1)
    expect(store.notifications.value[0].message).toBe('Hello')
  })

  it('dismisses a notification', () => {
    const id = store.showNotification({ message: 'Ephemeral' })
    store.dismissNotification(id)
    expect(store.notifications.value.length).toBe(0)
  })

  it('auto-dismisses a notification after a timeout', () => {
    store.showNotification({ message: 'Timed out', timeout: 3000 })
    expect(store.notifications.value.length).toBe(1)

    jest.advanceTimersByTime(3000)

    expect(store.notifications.value.length).toBe(0)
  })

  it('clears all notifications', () => {
    store.showNotification({ message: 'One' })
    store.showNotification({ message: 'Two' })
    store.clearAllNotifications()
    expect(store.notifications.value.length).toBe(0)
  })
})
