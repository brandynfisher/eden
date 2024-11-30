import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  extensionsToTreatAsEsm: ['.ts'],
  // preset: 'ts-jest',
  preset: 'ts-jest/presets/default-esm',
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/features/(.*)$': '<rootDir>/features/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/providers/(.*)$': '<rootDir>/providers/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/stores/(.*)$': '<rootDir>/stores/$1',
    photoswipe:
      '<rootDir>/../../node_modules/photoswipe/dist/umd/photoswipe.umd.min.js',
    'react-truncate-inside':
      '<rootDir>/../../node_modules/react-truncate-inside/lib/index.js',
  },
  // transform: {
  //   '^.+\\.[tj]sx?$': 'ts-jest',
  // },
  // transform: {
  //   '^.+\\.(js|jsx)$': "babel-jest"
  // },
  // transform: {
  //   '^.+\\.[tj]s$': [
  //     'babel-jest',
  //     {
  //       tsconfig: '<rootDir>/tsconfig.json'
  //     }
  //   ]
  // },
  transformIgnorePatterns: [
    // 'node_modules/(?!(react-photoswipe-gallery|photoswipe)/)', // Include problematic modules
    '<rootDir>/../../node_modules/(?!(react-photoswipe-gallery|photoswipe|react-truncate-inside)/)', // Include problematic modules
    // 'node_modules/(?!(react-photoswipe-gallery|photoswipe)/)', // Include problematic modules
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'node'],
}

module.exports = createJestConfig(config)
