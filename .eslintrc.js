/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
  env: {
    es2022: true,
    node: true,
  },
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['node_modules/', 'babel.config.js', 'metro.config.js', 'app.config.js'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}'],
      env: { browser: true },
      globals: {
        __DEV__: 'readonly',
      },
    },
  ],
};
