module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  moduleNameMapper: {
    // `server-only` rzuca wyjątkiem poza runtime'em Next — w testach nieszkodliwy no-op.
    '^server-only$': '<rootDir>/__mocks__/server-only.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      useESM: false,
    }],
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/*.(spec|test).[jt]s?(x)',
    '<rootDir>/__tests__/**/*.(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/prisma/',
    'test-helpers\\.ts$',
    'test-setup\\.ts$',
  ],
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  transformIgnorePatterns: [
    'node_modules/(?!(date-fns|@prisma|next-intl|use-intl|jose)/)',
  ],
};
