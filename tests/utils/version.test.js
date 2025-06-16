import version from '@/utils/version'

describe('version', () => {
  it('should return the correct version string', () => {
    const expected = `${version.major}.${version.minor}.${version.patch}-${version.build}`
    expect(version.getVersion()).toBe(expected)
  })

  it('should return the correct full version string', () => {
    const expected = `${version.getVersion()} (${version.environment})`
    expect(version.getFullVersion()).toBe(expected)
  })

  it('should handle missing build number', () => {
    const originalBuild = version.build
    version.build = null
    const expected = `${version.major}.${version.minor}.${version.patch}`
    expect(version.getVersion()).toBe(expected)
    version.build = originalBuild // Restore original value
  })
})
