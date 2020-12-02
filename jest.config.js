module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/preload.ts',
  ],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/out/'],
  coverageThreshold: {
    // TODO: ratchet these up to 100 over time
    global: {
      statements: 90,
      branches: 81,
      functions: 90,
      lines: 90,
    },
  },
}
