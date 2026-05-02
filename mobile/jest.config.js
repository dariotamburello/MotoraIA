/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testRegex: ".*\\.(test|spec)\\.[jt]sx?$",
  testPathIgnorePatterns: ["/node_modules/"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  modulePaths: ["<rootDir>/../node_modules"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          strict: false,
          target: "ES2022",
          types: ["jest", "node"],
        },
        // warnOnly: surface type errors in test output without breaking the
        // run. CI greps the log for "warning TSxxxx" to fail the build.
        diagnostics: { warnOnly: true },
        isolatedModules: true,
      },
    ],
  },
};
