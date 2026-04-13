// ─────────────────────────────────────────────────────────────────────────────
// Comandos de autenticación
// ─────────────────────────────────────────────────────────────────────────────

/**
 * cy.fillLogin(username, password)
 * Llena los campos del formulario de login y hace submit.
 */
Cypress.Commands.add('fillLogin', (username, password) => {
  // Campo usuario — el app usa placeholder "usuario@ejemplo.com"
  cy.get('input').not('[type="password"]').first().clear().type(username, { force: true });
  cy.get('input[type="password"]').first().clear().type(password, { force: true });
  cy.contains('button', /Ingresar|Iniciar sesión|Login/i).click();
});

/**
 * cy.loginExitoso()
 * Hace login con las credenciales válidas y espera a que el dashboard cargue.
 */
Cypress.Commands.add('loginExitoso', () => {
  const username = Cypress.env('USERNAME');
  const password = Cypress.env('PASSWORD');

  cy.visit('/auth');
  cy.fillLogin(username, password);

  // Esperar redirección al dashboard
  cy.url({ timeout: 12000 }).should('not.include', '/auth');
});
