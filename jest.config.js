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
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/out/',
  ],
  coverageThreshold: {
    // TODO: ratchet these up to 100 over time
    global: {
      statements: 87,
      branches: 63,
      functions: 90,
      lines: 87,
    },
  },
};
