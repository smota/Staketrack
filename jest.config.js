module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    'vuetify/styles': '<rootDir>/tests/mocks/styleMock.js',
    'vuetify/components': '<rootDir>/node_modules/vuetify/lib/components/index.mjs',
    'vuetify/directives': '<rootDir>/node_modules/vuetify/lib/directives/index.mjs',
    '\\.(css|less|sass|scss)$': '<rootDir>/tests/mocks/styleMock.js',
    'leaflet': '<rootDir>/tests/mocks/leafletMock.js'
  },
  setupFiles: ['<rootDir>/tests/setup.js'],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setupAfterEnv.js',
    '<rootDir>/tests/setupUndici.js'
  ],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    'src/**/*.vue',
    '!src/node_modules/**'
  ],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.(js|jsx|mjs)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(vuetify|vue-router|@opentelemetry)/)'
  ]
}
