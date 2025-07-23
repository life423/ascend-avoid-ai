import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node
      },
      ecmaVersion: 2022,
      sourceType: "module"
    }
  },
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/**",
      "build/**", 
      "node_modules/**",
      "**/*.js.map",
      "src/constants/*.js",
      "src/constants/*.d.ts",
      "coverage/**"
    ]
  },
  {
    files: ["**/*.ts"],
    rules: {
      // Error prevention
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": ["error", { "allowExpressions": true }],
      "@typescript-eslint/no-non-null-assertion": "error",
      
      // Code quality
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      
      // Style consistency
      "semi": ["error", "always"],
      "quotes": ["error", "single", { "avoidEscape": true }],
      "indent": ["error", 2]
    }
  }
]);