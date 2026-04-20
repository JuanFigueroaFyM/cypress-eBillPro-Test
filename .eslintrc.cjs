/* eslint-env node */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    'cypress/globals': true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:cypress/recommended',
    'prettier',
  ],
  plugins: ['cypress'],
  rules: {
    // ─── Reglas clave para evitar los anti-patrones de la auditoría ────────
    'cypress/no-unnecessary-waiting': 'error',   // prohíbe cy.wait(ms) fijos
    'cypress/no-assigning-return-values': 'error',
    'cypress/no-force': 'warn',                  // cada force: true debe justificarse
    'cypress/no-async-tests': 'error',
    'cypress/assertion-before-screenshot': 'error',
    'cypress/require-data-selectors': 'off',     // TODO: poner 'warn' cuando FE agregue data-testid

    // ─── JS básico ──────────────────────────────────────────────────────────
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    eqeqeq: ['error', 'smart'],
  },
  overrides: [
    {
      files: ['cypress/**/*.cy.js'],
      rules: {
        // En specs permitir describe/it/etc. sin warnings.
        'no-unused-expressions': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'cypress/reports/',
    'cypress/screenshots/',
    'cypress/videos/',
    'cypress/downloads/',
  ],
};
