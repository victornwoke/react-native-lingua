/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  clearMocks: true,
  restoreMocks: true,
  testPathIgnorePatterns: ["/node_modules/", "/.expo/"],
};