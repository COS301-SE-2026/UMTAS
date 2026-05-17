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
  ]),
  {
    settings: {
      // Hardcode React version to avoid eslint-plugin-react calling the
      // removed context.getFilename() API when auto-detecting under ESLint 10.
      react: { version: "19.0" },
    },
  },
]);

export default eslintConfig;
