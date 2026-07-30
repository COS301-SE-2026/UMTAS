import type { Config } from 'jest';
import { createDefaultEsmPreset } from 'ts-jest';

const config: Config = {
  ...createDefaultEsmPreset({
    tsconfig: '<rootDir>/tsconfig.json',
  }),
  rootDir: '.',
  roots: ['<rootDir>/../integration/flows'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/../integration/flows/*.flow.int.ts'],
  moduleNameMapper: {
    '^shared-types$':
      '<rootDir>/../../../../packages/shared-types/src/index.ts',
    '^src/(.*)$': '<rootDir>/../../src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testTimeout: 480_000,
  maxWorkers: 1,
  bail: 1,
  verbose: true,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
      },
    ],
  ],
};

export default config;
