/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
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
  testPathIgnorePatterns: ['/test/integration/'],
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/out/',
  ],
  coverageThreshold: {
    // TODO: ratchet these up to 100 over time
    global: {
      statements: 89,
      branches: 68,
      functions: 90,
      lines: 89,
    },
  },
};
