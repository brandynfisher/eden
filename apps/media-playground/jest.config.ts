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
  testEnvironment: 'jsdom',

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
  },

  // Transform configurations
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  // Ignore transformations for certain node_modules
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/(?!(react-photoswipe-gallery|photoswipe|react-truncate-inside|@clerk/nextjs)/)',
  ],

  // File extensions to process
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'node'],

  // Global test configurations
  globals: {
    'ts-jest': {
      // useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
}

module.exports = createJestConfig(config)
