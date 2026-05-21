/** @type {import('jest').Config} */
require("dotenv").config({ path: ".env" });

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/?(*.)+(int).ts?(x)"], // only match *.int.ts or *.int.tsx
  testPathIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  moduleFileExtensions: ["js", "ts", "tsx", "json"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!**/*.int.ts",
    "!**/*.int.tsx",
  ],
};
