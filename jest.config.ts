import type { Config } from 'jest';
const config: Config = {
    moduleDirectories: ['node_modules', 'src'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    testPathIgnorePatterns: ['/node_modules/', '/.worktrees/'],
    modulePathIgnorePatterns: ['<rootDir>/.worktrees'],
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
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
    testEnvironment: 'node',
};
export default config;
