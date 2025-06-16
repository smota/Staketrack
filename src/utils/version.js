/**
 * Version information for StakeTrack
 * This file is automatically updated during the deployment process
 */

export default {
  major: 1,
  minor: 4,
  patch: 0,
  build: '047630',
  timestamp: new Date().toISOString(),
  environment: process.env.ENVIRONMENT || 'DEV',

  /**
   * Returns the full version string
   * @returns {string} Version in format "major.minor.patch-build"
   */
  getVersion() {
    return `${this.major}.${this.minor}.${this.patch}${this.build ? `-${this.build}` : ''}`
  },

  /**
   * Returns the full version string with environment
   * @returns {string} Version in format "major.minor.patch-build (environment)"
   */
  getFullVersion() {
    return `${this.getVersion()} (${this.environment})`
  }
}
