import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Base configuration for all files
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      },
      ecmaVersion: 2022,
      sourceType: "module"
    }
  },

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Global ignores
  {
    ignores: [
      "dist/**",
      "build/**", 
      "node_modules/**",
      "**/*.js.map",
      "shared/schema/*.js",
      "shared/schema/*.d.ts",
      "coverage/**",
      "server/dist/**",
      ".claude/**"
    ]
  },

  // Client-side TypeScript rules
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    rules: {
      // Error prevention
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn", // Relaxed for game dev
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // Game-specific allowances
      "no-console": ["warn", { "allow": ["warn", "error", "log"] }], // Allow console.log for debugging
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      
      // Code quality
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      
      // Style consistency
      "semi": ["error", "always"],
      "quotes": ["error", "single", { "avoidEscape": true }],
      "indent": ["error", 4], // Match your existing code style
      "comma-dangle": ["error", "never"]
    }
  },

  // Server-side TypeScript rules (more strict)
  {
    files: ["server/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": ["error", { "allowExpressions": true }],
      "@typescript-eslint/no-non-null-assertion": "error",
      
      // Server logging is more controlled
      "no-console": ["error", { "allow": ["warn", "error"] }],
      
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "semi": ["error", "always"],
      "quotes": ["error", "double"], // Server uses double quotes
      "indent": ["error", 2] // Server uses 2-space indentation
    }
  },

  // Test files - more relaxed
  {
    files: ["tests/**/*.ts", "**/*.spec.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off"
    }
  },

  // Configuration files
  {
    files: ["*.config.{js,ts}", "vite.config.js", "jest.config.cjs"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off"
    }
  },

  // Shared schema files (generated code)
  {
    files: ["shared/schema/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  }
];
