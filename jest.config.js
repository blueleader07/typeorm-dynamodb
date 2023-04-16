module.exports = {
    preset: 'ts-jest',
    reporters: ['default', ['jest-junit', { outputDirectory: 'test-reports/' }]],
    testEnvironment: 'node',
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        }
    },
    collectCoverageFrom: [
        'src/**/*.ts*'
    ]
}
