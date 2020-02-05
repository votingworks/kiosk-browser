module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/out/'],
  coverageThreshold: {
    // TODO: ratchet these up to 100 over time
    global: {
      statements: 72,
      branches: 60,
      lines: 72,
      functions: 67,
    },
  },
}
