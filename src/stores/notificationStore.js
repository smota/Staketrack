import { ref } from 'vue'

const notifications = ref([])
let nextId = 1

/**
 * Notifications store
 * Manages application-wide notifications
 */
export function useNotificationStore() {
  /**
   * Show a notification
   * @param {Object} notification - The notification to show
   * @param {string} notification.message - The notification message
   * @param {string} notification.type - The notification type (success, error, info, warning)
   * @param {number} [notification.timeout=5000] - The timeout in ms before automatically dismissing
   */
  function showNotification({ message, type = 'info', timeout = 5000 }) {
    const id = nextId++

    // Add notification to the list
    notifications.value.push({
      id,
      message,
      type,
      timestamp: new Date()
    })

    // Auto-dismiss after timeout
    if (timeout > 0) {
      setTimeout(() => {
        dismissNotification(id)
      }, timeout)
    }

    return id
  }

  /**
   * Dismiss a notification by ID
   * @param {number} id - The notification ID to dismiss
   */
  function dismissNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Clear all notifications
   */
  function clearAllNotifications() {
    notifications.value = []
  }

  return {
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications
  }
}
