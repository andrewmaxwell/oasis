import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {ignores: ['dist/']},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: {
        console: 'readonly',
        ...reactPlugin.configs.flat.recommended.languageOptions?.globals,
      },
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    settings: {react: {version: 'detect'}},
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.recommended.rules,

      // Prettier plugin rules
      'prettier/prettier': [
        'warn',
        {singleQuote: true, bracketSpacing: false, endOfLine: 'auto'},
      ],

      // Custom rules
      'dot-notation': 'warn',
      'quote-props': ['warn', 'as-needed'],
      'arrow-body-style': ['warn', 'as-needed'],
      'object-shorthand': 'warn',
      'no-use-before-define': 'warn',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'no-prototype-builtins': 'off',
      'prefer-destructuring': 'warn',
      'no-nested-ternary': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Prettier config (disables conflicting rules) - must be last
  eslintConfigPrettier,
];
