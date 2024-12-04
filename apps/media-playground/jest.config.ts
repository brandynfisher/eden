import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-jsdom',

  // ESM and TypeScript support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  preset: 'ts-jest/presets/default-esm',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',

    // Handle module imports for specific libraries
    photoswipe:
      '<rootDir>/../../node_modules/photoswipe/dist/umd/photoswipe.umd.min.js',
    'react-truncate-inside':
      '<rootDir>/../../node_modules/react-truncate-inside/lib/index.js',
    // Mock @assistant-ui/react
    '^@assistant-ui/react$': '<rootDir>/__mocks__/assistant-ui-react.js',
  },

  // Global test configurations
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },

  transform: {
    // Use ts-jest for TypeScript files
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Ignore transformations for certain node_modules
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/(?!(react-photoswipe-gallery|photoswipe|react-truncate-inside|@clerk/nextjs)/)',
  ],

  // File extensions to process
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
    'cjs',
    'mjs',
  ],
}

module.exports = createJestConfig(config)
