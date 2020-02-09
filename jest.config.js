module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts', '!src/index.ts', '!src/preload.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/out/'],
  coverageThreshold: {
    // TODO: ratchet these up to 100 over time
    global: {
      statements: 84,
      branches: 75,
      lines: 81,
      functions: 82,
    },
  },
}
