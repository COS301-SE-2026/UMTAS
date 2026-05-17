import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Config files use CommonJS require() — not TypeScript source
    "jest.config.js",
    // Generated output
    "coverage/**",
  ]),
  {
    settings: {
      // Hardcode React version to avoid eslint-plugin-react calling the
      // removed context.getFilename() API when auto-detecting under ESLint 10.
      react: { version: "19.0" },
    },
    rules: {
      // App Router has no pages/ directory — this Pages Router rule is N/A
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
