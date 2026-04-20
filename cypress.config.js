// =============================================================================
// cypress.config.js — Configuración raíz de Cypress.
// -----------------------------------------------------------------------------
// Principios:
//   • baseUrl y apiUrl vienen de config/env.<env>.json (sin hardcoded values).
//   • Credenciales se inyectan via cypress.env.json (local) o CI secrets.
//   • Video solo en fallo, screenshots siempre.
//   • Timeouts explícitos para evitar falsos negativos por red lenta.
// =============================================================================

const { defineConfig } = require('cypress');
const path = require('path');
const fs = require('fs');

// ─── Resolución de ambiente ───────────────────────────────────────────────
const envName = process.env.CYPRESS_ENV || 'test';
const envFile = path.resolve(__dirname, `config/env.${envName}.json`);
if (!fs.existsSync(envFile)) {
  throw new Error(
    `[cypress.config] Falta config/env.${envName}.json. ` +
      `Ambientes disponibles: ${fs.readdirSync('config').join(', ')}`,
  );
}
const envConfig = JSON.parse(fs.readFileSync(envFile, 'utf8'));

module.exports = defineConfig({
  projectId: 'jt9552',

  // ─── Reporter ──────────────────────────────────────────────────────────
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportFilename: '[datetime]-[status]-report',
    overwrite: false,
    html: true,
    json: true,
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: true, // ver retries para detectar flakes
    reportPageTitle: `eBill Pro — E2E (${envConfig.name})`,
    reportTitle: 'Suite: Autenticación + Documentos + Clientes',
  },

  e2e: {
    // ─── URLs inyectadas por ambiente ────────────────────────────────────
    baseUrl: envConfig.baseUrl,

    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',

    // ─── Viewport fijo para screenshots consistentes ──────────────────────
    viewportWidth: 1280,
    viewportHeight: 800,

    // ─── Timeouts explícitos ──────────────────────────────────────────────
    defaultCommandTimeout: 8000,
    pageLoadTimeout: 30000,
    requestTimeout: 15000,
    responseTimeout: 15000,

    // ─── Retries como red de seguridad (no para esconder flakiness) ──────
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // ─── Video solo si hay fallos (ahorra espacio + acelera CI) ──────────
    video: false,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,

    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 25, // evita OOM en specs largos

    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);

      // Plugin de tags @smoke / @regression / @critical.
      try {
        require('@cypress/grep/src/plugin')(config);
      } catch {
        // Plugin opcional; si no está instalado, seguimos sin filtrado por tags.
      }

      // Eliminar videos de los tests que pasaron (ahorra storage en CI).
      on('after:spec', (spec, results) => {
        if (!results || !results.video) return;
        const failures = results.tests?.some((t) => t.attempts?.some((a) => a.state === 'failed'));
        if (!failures) {
          try {
            fs.unlinkSync(results.video);
          } catch (_) {
            /* ignore */
          }
        }
      });

      return config;
    },

    // ─── Env inyectados a cy.env() ───────────────────────────────────────
    env: {
      apiUrl: envConfig.apiUrl,
      locale: envConfig.locale,
      country: envConfig.country,
      envName: envConfig.name,
      // Credenciales y users.* se resuelven desde cypress.env.json
      // (gitignored) o desde process.env.CYPRESS_* en CI.
    },
  },
});
