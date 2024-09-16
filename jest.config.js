// dirty patch to keep @actions/core from printing during tests
const processStdoutWrite = process.stdout.write.bind(process.stdout)
process.stdout.write = (strOrBytes, encodingOrCallback, callback) => {
  if (typeof strOrBytes === 'string' && !strOrBytes.startsWith('::')) {
    return processStdoutWrite(strOrBytes, encodingOrCallback, callback)
  }
  return true
}

/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  verbose: true,
  clearMocks: true,
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  coverageReporters: ['json-summary', 'text', 'lcov'],
  collectCoverage: true,
  collectCoverageFrom: ['./src/**']
}

module.exports = config
