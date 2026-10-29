import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "dist/",
    ".artifacts/",
    ".wrangler/",
    ".venv/",
    "test-results/",
    "playwright-report/",
    "apps/web/public/",
    "apps/web/src/data/generated/",
    "apps/web/src/data/official-geography-2025/",
  ]),
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    extends: [js.configs.recommended],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      // Os templates HTML usam espaços inseparáveis intencionais no texto.
      "no-irregular-whitespace": ["error", { skipTemplates: true }],
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [tseslint.configs.recommended],
    rules: {
      "prefer-const": ["error", { ignoreReadBeforeAssign: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Módulos reconstruídos da referência compartilham imports e assinaturas.
    // O histórico também tem seus bytes preservados pelo inventário SHA-256.
    // As demais regras de correção continuam ativas nestes dois conjuntos.
    files: ["apps/web/src/features/{apuracao,projetar}/**/*.js"],
    rules: { "no-unused-vars": "off" },
  },
  {
    files: ["apps/web/**/*.{js,jsx,mjs,ts,tsx,mts}", "e2e/**/*.ts"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      "scripts/**/*.{js,mjs,cjs,ts,mts,cts}",
      "*.{js,mjs,cjs,ts,mts,cts}",
      "e2e/**/*.ts",
    ],
    languageOptions: { globals: globals.node },
  },
]);
