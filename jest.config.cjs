// jest.config.cjs
module.exports = {
  preset: 'ts-jest/presets/default-esm', // ESM preset for ts-jest
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }], // transform TS as ESM
  },
  extensionsToTreatAsEsm: ['.ts'], // treat .ts as ESM
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/tests/**/*.test.ts'],
};
