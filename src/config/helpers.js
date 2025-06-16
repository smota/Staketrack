/**
 * Configuration helper functions.
 * @module src/config/helpers
 */

/**
 * Parses a comma-separated string into an array of strings.
 * @param {string} value - The comma-separated string.
 * @param {Array} [defaultValue=[]] - The default value if the input is falsy.
 * @returns {Array} The parsed array.
 */
export const parseArrayValue = (value, defaultValue = []) => {
  if (!value) return defaultValue
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

/**
 * Parses a string or number into a boolean.
 * @param {*} value - The value to parse.
 * @param {boolean} [defaultValue=false] - The default value if the input is null or undefined.
 * @returns {boolean} The parsed boolean.
 */
export const parseBooleanFlag = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue
  return value === 'true' || value === true || value === '1' || value === 1
}
