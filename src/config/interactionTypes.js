/**
 * Interaction types configuration
 */

export const interactionTypes = [
  { id: 'meeting', label: 'Meeting', icon: 'mdi-account-group' },
  { id: 'call', label: 'Call', icon: 'mdi-phone' },
  { id: 'email', label: 'Email', icon: 'mdi-email' },
  { id: 'social', label: 'Social', icon: 'mdi-account-box' },
  { id: 'other', label: 'Other', icon: 'mdi-help-circle' }
]

/**
 * Get label for interaction type
 * @param {string} type - The interaction type id
 * @returns {string} The human-readable label
 */
export const getInteractionTypeLabel = (type) => {
  const interactionType = interactionTypes.find(t => t.id === type)
  return interactionType ? interactionType.label : 'Unknown'
}

/**
 * Get icon for interaction type
 * @param {string} type - The interaction type id
 * @returns {string} The icon name
 */
export const getInteractionTypeIcon = (type) => {
  const interactionType = interactionTypes.find(t => t.id === type)
  return interactionType ? interactionType.icon : 'mdi-help-circle'
}

/**
 * Get color for interaction type
 * @param {string} type - The interaction type id
 * @returns {string} The color name
 */
export const getInteractionColor = (type) => {
  switch (type) {
  case 'meeting':
    return 'primary'
  case 'call':
    return 'secondary'
  case 'email':
    return 'info'
  case 'social':
    return 'success'
  default:
    return 'grey'
  }
}
