import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Lint config for the System 5 frontend.
 * (The old `lint` script pointed at an eslint.config.mjs and a custom
 * formatter that were never in the repo, so `npm run lint` always failed.)
 *
 * src/components/ui/** is vendored shadcn/ui source — not linted.
 */
export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'dev-dist/**', 'src/components/ui/**', 'src/hooks/use-toast.js'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^(_|React$)' }],
    },
  },
  {
    files: ['vite.config.js', 'vitest.config.js', 'tailwind.config.js', 'postcss.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/__tests__/**', 'src/test/**'],
    languageOptions: { globals: { ...globals.node } },
  },
];
