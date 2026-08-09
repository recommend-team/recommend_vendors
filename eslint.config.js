import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    /**
     * The `lib/` boundary, enforced rather than remembered.
     *
     * `lib/` is what moves to React Native untouched — API calls, types, auth, rules.
     * The moment it imports React or reaches for the DOM it stops being portable, and
     * the eventual port turns from a re-skin into a rewrite. That erosion happens one
     * innocent import at a time, which is exactly the kind of thing a linter is better
     * at noticing than a person.
     *
     * DOM *types* are unavoidable here — `fetch` and `localStorage` are web APIs and
     * this is a web app today. What matters is that no React, and no rendering, lives
     * below this line. React Native supplies its own `fetch` and its own storage, so
     * those call sites are a small, known swap.
     */
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message:
                'src/lib must stay framework-agnostic — it moves to React Native as-is. Put React code in hooks/ or components/.',
            },
            {
              name: 'react-dom',
              message: 'src/lib must stay framework-agnostic.',
            },
            {
              name: 'react-router-dom',
              message:
                'Routing is a UI concern. src/lib must not know how screens are reached.',
            },
            {
              name: '@tanstack/react-query',
              message:
                'src/lib holds the calls; caching them is a hooks/ concern.',
            },
          ],
          patterns: [
            {
              group: ['../components/*', '../hooks/*', '../screens/*'],
              message: 'src/lib must never import from the UI layers.',
            },
          ],
        },
      ],
    },
  },
  {
    // Vite config and the eslint config itself run in Node, not the browser.
    files: ['vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: { process: 'readonly' } },
  },
);
