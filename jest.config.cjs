// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',               // or 'node' if you don’t need DOM APIs
  moduleFileExtensions: ['ts','js','json'],
  testMatch: ['**/tests/**/*.spec.ts'],   // where your spec lives
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  transformIgnorePatterns: ['/node_modules/']  // default
};
