/** @type {import('jest').Config} */
const base = require("./jest.config.js");

module.exports = {
  ...base,
  testPathIgnorePatterns: ["/node_modules/", "/lib/"],
  testRegex: "tests/rules/.*\\.(test|spec)\\.[jt]sx?$",
};
