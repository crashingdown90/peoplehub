/* eslint-disable @typescript-eslint/no-require-imports */
// @ai:ag - Created by Antigravity
// Jest configuration for PeopleHub

const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app
    dir: './',
});

// Custom Jest configuration
const customJestConfig = {
    // Default to jsdom for React components/hooks - service tests use @jest-environment node docblock
    testEnvironment: 'jsdom',

    // Setup files after env
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Module name mapper for path aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Test patterns - include all test files
    testMatch: [
        '<rootDir>/tests/**/*.test.ts',
        '<rootDir>/tests/**/*.test.tsx',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
        'src/hooks/**/*.ts',
        'src/hooks/**/*.tsx',
        'src/lib/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
        '!src/**/types.ts',
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Test timeout
    testTimeout: 15000,

    // Ignore patterns
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    transformIgnorePatterns: ['/node_modules/(?!(@prisma)/)'],
};

module.exports = createJestConfig(customJestConfig);
