/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testRegex: ".*\\.(test|spec)\\.[jt]sx?$",
  testPathIgnorePatterns: ["/node_modules/", "/lib/", "/tests/rules/"],
  modulePaths: ["<rootDir>/../node_modules"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2022",
          module: "commonjs",
          esModuleInterop: true,
          strict: true,
          types: ["jest", "node"],
        },
        // warnOnly: surface type errors in test output without failing the run.
        diagnostics: { warnOnly: true },
        isolatedModules: true,
      },
    ],
  },
};
