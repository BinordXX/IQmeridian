const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['dist/**', '.next/**', 'coverage/**', 'node_modules/**'],
  },
  {
    rules: {
      'no-console': 'warn',
    },
  },
];
