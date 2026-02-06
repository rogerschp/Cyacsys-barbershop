"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
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
        '/dto/',
        '/interfaces/',
        '/factories/',
        '/utils/',
    ],
    coverageDirectory: 'coverage',
    testEnvironment: 'node',
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map