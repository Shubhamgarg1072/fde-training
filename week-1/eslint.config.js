import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  {
    files: ['**/*.test.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
