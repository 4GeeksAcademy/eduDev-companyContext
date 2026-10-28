/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/__tests__/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: { module: 'CommonJS', moduleResolution: 'node', incremental: false },
    }],
  },
  collectCoverageFrom: [
    'services/auth.ts',
    'lib/auth-form.ts',
    'lib/profile-form.ts',
    'lib/password-form.ts',
    'lib/labels.ts',
    'services/api.ts',
  ],
};
