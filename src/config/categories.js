/**
 * Stakeholder Categories Configuration
 * Defines available stakeholder categories for the application
 */

/**
 * Standard stakeholder categories
 * @type {Array<Object>}
 */
export const categoryOptions = [
  { title: 'Executive', value: 'executive' },
  { title: 'Manager', value: 'manager' },
  { title: 'Team Member', value: 'team_member' },
  { title: 'Customer', value: 'customer' },
  { title: 'Partner', value: 'partner' },
  { title: 'Regulator', value: 'regulator' },
  { title: 'Other', value: 'other' }
]

/**
 * Category color mapping
 * @type {Object}
 */
export const categoryColors = {
  executive: '#8E24AA', // purple
  manager: '#1E88E5', // blue
  team_member: '#43A047', // green
  customer: '#FB8C00', // orange
  partner: '#F4511E', // deep orange
  regulator: '#C62828', // red
  other: '#757575' // grey
}

/**
 * Get color for a category
 * @param {string} category - Category value
 * @returns {string} - Hex color code
 */
export const getCategoryColor = (category) => {
  return categoryColors[category] || categoryColors.other
}

export default {
  categoryOptions,
  categoryColors,
  getCategoryColor
}
