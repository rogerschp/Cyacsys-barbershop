import type { Config } from 'jest';
import baseConfig from './jest.config';

const config: Config = {
  ...baseConfig,
  testRegex: undefined,
  collectCoverageFrom: ['src/modules/search/**/*.ts'],
  testMatch: ['<rootDir>/src/test/unit/search/**/*.spec.ts'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;
