import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    // Map shared-types to the source TypeScript files
    '^shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
    '^shared-types/(.*)$': '<rootDir>/../../packages/shared-types/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  transformIgnorePatterns: [
    // Transform shared-types and better-auth
    'node_modules/(?!(shared-types|better-auth|@better-auth)/)',
  ],
  collectCoverageFrom: [
    '**/*service.ts',
    '!**/*.spec.ts',
    '!**/*.int.ts',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/swagger-theme.ts',
    '!**/integration/**',
    '!**/db/**',
    '!**/entities/**',
    '!**/health/**',
    '!**/mail/**',
    '!**/redis/**',
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  coverageReporters: ['text', 'html', 'lcov'],
};

export default config;
