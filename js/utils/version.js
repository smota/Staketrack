/**
 * StakeTrack Version Management
 * 
 * This file manages application version information.
 * The version follows Semantic Versioning (semver) pattern: MAJOR.MINOR.PATCH
 * 
 * - MAJOR: Breaking changes
 * - MINOR: New features, non-breaking
 * - PATCH: Bug fixes, non-breaking
 */

// Version details - will be updated during build/deployment
const version = {
  major: 2,
  minor: 0,
  patch: 0,
  build: '577671',
  timestamp: new Date().toISOString(),
  environment: process.env.ENVIRONMENT || 'DEV'
};

/**
 * Generate a full version string
 * @returns {string} Full version string (e.g., "1.0.0-dev (20240317-12345)")
 */
export function getFullVersion() {
  const buildSuffix = version.build ? `-${version.build}` : '';
  const envSuffix = version.environment === 'DEV' ? '-dev' : '';
  const datePart = new Date(version.timestamp).toISOString().split('T')[0].replace(/-/g, '');

  return `${version.major}.${version.minor}.${version.patch}${envSuffix}${buildSuffix} (${datePart})`;
}

/**
 * Get semantic version string
 * @returns {string} Semantic version string (e.g., "1.0.0")
 */
export function getSemanticVersion() {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Get version information object
 * @returns {Object} Version information
 */
export function getVersionInfo() {
  return { ...version };
}

export default {
  getFullVersion,
  getSemanticVersion,
  getVersionInfo
}; 