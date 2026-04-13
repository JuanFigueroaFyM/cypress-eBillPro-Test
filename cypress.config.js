const { defineConfig } = require('cypress');

module.exports = defineConfig({

  projectId: "jt9552",

  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportFilename: '[datetime]-[status]-report',
    overwrite: false,
    html: true,
    json: true,
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,           // reporte HTML autocontenido (un solo archivo)
    saveAllAttempts: false,       // solo el último intento por test
    reportPageTitle: 'eBill Pro — Reporte de Pruebas E2E',
    reportTitle: 'Suite: Autenticación',
  },

  e2e: {
    baseUrl: 'https://ebillprogotest.facturaenlinea.co',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',

    viewportWidth: 1280,
    viewportHeight: 800,

    defaultCommandTimeout: 8000,
    pageLoadTimeout: 30000,

    retries: {
      runMode: 1,
      openMode: 0,
    },

    video: false,
    screenshotOnRunFailure: true,

    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },

    env: {
      USERNAME: 'cinecolombiatest',
      PASSWORD: 'soporte@1',
    },
  },
});