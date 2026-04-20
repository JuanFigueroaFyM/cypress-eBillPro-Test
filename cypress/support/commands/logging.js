// =============================================================================
// Commands — Logging estructurado
// -----------------------------------------------------------------------------
// Ayuda a debuggear tests: cada paso queda registrado en el Command Log de
// Cypress y en el reporte HTML con detalles expandibles.
// =============================================================================

/**
 * cy.logStep(title, details?)
 * Loguea un paso de alto nivel con payload opcional.
 */
Cypress.Commands.add('logStep', (title, details = {}) => {
  Cypress.log({
    name: 'STEP',
    displayName: 'STEP',
    message: title,
    consoleProps: () => details,
  });
});
