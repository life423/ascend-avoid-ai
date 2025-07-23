module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // Error prevention
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Code quality
    'no-console': ['warn', { 'allow': ['warn', 'error'] }],
    'prefer-const': 'error',
    
    // Style consistency
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { 'avoidEscape': true }]
  }
}