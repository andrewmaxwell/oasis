module.exports = {
  root: true,
  env: {browser: true, es2020: true},
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
    'plugin:react/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'prettier', 'react'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      {allowConstantExport: true},
    ],
    'prettier/prettier': [
      'warn',
      {
        singleQuote: true,
        bracketSpacing: false,
      },
    ],
    'dot-notation': 'warn',
    'quote-props': ['warn', 'as-needed'],
    'arrow-body-style': ['warn', 'as-needed'],
    'object-shorthand': 'warn',
    'no-use-before-define': 'warn',
    'no-prototype-builtins': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  },
  settings: {react: {version: 'detect'}}
};
