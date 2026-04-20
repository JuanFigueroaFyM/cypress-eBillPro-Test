// =============================================================================
// Commands — Navegación
// -----------------------------------------------------------------------------
// Wrappers finos sobre Page Objects para casos puntuales.
// Para flujos completos, usar directamente las clases de /pages.
// =============================================================================

import SEL from '../selectors';

/**
 * cy.navigateTo(module)
 * Navega a un módulo del sidebar via click en el link correspondiente.
 */
Cypress.Commands.add('navigateTo', (module) => {
  const selector = SEL.nav[module];
  if (!selector) {
    throw new Error(
      `[navigateTo] Módulo '${module}' no existe. Disponibles: ${Object.keys(SEL.nav).join(', ')}`,
    );
  }
  cy.get(selector).click();
});

/**
 * cy.esperarApi(alias, {status})
 * Azúcar sintáctico para esperar un alias y validar status code.
 */
Cypress.Commands.add('esperarApi', (alias, { status = 200 } = {}) => {
  return cy.wait(alias).then(({ response }) => {
    expect(response.statusCode, `${alias} statusCode`).to.eq(status);
    return response.body;
  });
});
