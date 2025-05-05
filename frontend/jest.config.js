export default {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.scss$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(css|less|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    '^../../config/env$': '<rootDir>/src/__mocks__/envMock.js',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
}; 