module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/js/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/node_modules/**',
  ],
}; 