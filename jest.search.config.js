"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_config_1 = require("./jest.config");
const config = {
    ...jest_config_1.default,
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
exports.default = config;
//# sourceMappingURL=jest.search.config.js.map