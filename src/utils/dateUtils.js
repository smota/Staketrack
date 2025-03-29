/**
 * Format a date to a localized string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString()
}

/**
 * Format a date to a localized string with time
 * @param {Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
  if (!date) return 'Never'
  return new Date(date).toLocaleString()
}

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 * @param {Date} date - The date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return 'Never'

  const now = new Date()
  const diff = now - new Date(date)

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  return 'Just now'
}
