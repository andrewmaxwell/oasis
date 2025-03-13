import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import {globalIgnores} from 'eslint/config';

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooks.configs['recommended-latest'],
  reactRefresh.configs.recommended,
  prettier,
  ...tseslint.configs.recommended,
  globalIgnores(['dist/']),
  {
    languageOptions: {
      globals: {console: 'readonly'},
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      'prettier/prettier': [
        'warn',
        {singleQuote: true, bracketSpacing: false, endOfLine: 'auto'},
      ],
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

    settings: {react: {version: 'detect'}},
  },
];
