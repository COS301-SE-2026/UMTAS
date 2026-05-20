import type { Config } from 'jest';
import { createDefaultEsmPreset } from 'ts-jest';

const preset = createDefaultEsmPreset({
  tsconfig: '<rootDir>/tsconfig.int.json',
});

const config: Config = {
  ...preset,
  rootDir: '.',
  testRegex: 'src/.*\\.int\\.ts$',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'mjs'],

  transformIgnorePatterns: ['node_modules/(?!(better-auth)/)'],

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  setupFilesAfterEnv: [],
  testTimeout: 30000,
};

export default config;
