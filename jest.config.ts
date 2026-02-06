import type { Config } from 'jest';

const config: Config = {
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.service.ts',
    'src/**/*.controller.ts',
    'src/**/*.repository.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/dto/',
    '/interfaces/',
    '/factories/',
    '/utils/',
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
};

export default config;
