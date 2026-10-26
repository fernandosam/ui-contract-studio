import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**", "coverage/**", "audits/upstream/shadcn-blocks/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["sandbox/**/*.mjs", "server-example/**/*.mjs", "src/**/*.{ts,tsx}", "scripts/**/*.{ts,mjs}", "tests/**/*.mjs", ".pi/extensions/**/*.ts", "vite.config.ts"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
];
