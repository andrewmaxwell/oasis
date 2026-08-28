import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactPlugin from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {ignores: ['dist/']},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: {console: 'readonly'},
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.recommended.rules,

      // Prettier plugin rules. Options live in .prettierrc.json so that `npm run
      // format`, editor format-on-save, and `npm run lint` cannot disagree.
      'prettier/prettier': 'warn',

      // Custom rules
      'dot-notation': 'warn',
      'quote-props': ['warn', 'as-needed'],
      'arrow-body-style': ['warn', 'as-needed'],
      'object-shorthand': 'warn',
      'no-use-before-define': 'warn',
      'no-prototype-builtins': 'off',
      'prefer-destructuring': 'warn',
      'no-nested-ternary': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Prettier config (disables conflicting rules) - must be last
  eslintConfigPrettier,
];
