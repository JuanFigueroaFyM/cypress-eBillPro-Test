// =============================================================================
// BasePage — clase padre para todos los Page Objects.
// -----------------------------------------------------------------------------
// Provee:
//   • visit(path, { waitForReady })  — navegación con espera de shell
//   • waitForReady()                  — hook para confirmar que la pantalla cargó
//   • intercept(alias, method, url)   — registro de alias con prefijo automático
//   • screenshot(name)                — captura con naming consistente
// =============================================================================

import SEL from '../support/selectors';

export default class BasePage {
  /**
   * Path que representa la pantalla. Lo definen las subclases.
   * @abstract
   */
  get path() {
    throw new Error(`${this.constructor.name}: debe definir 'get path()'`);
  }

  /**
   * Selector del elemento que confirma que la pantalla está lista.
   * Las subclases lo sobrescriben con algo más específico.
   */
  get readySelector() {
    return SEL.app.shell;
  }

  /**
   * Navega a `this.path` y espera a que la pantalla esté lista.
   * @returns {this}
   */
  visit() {
    cy.visit(this.path);
    this.waitForReady();
    return this;
  }

  /**
   * Verifica que la pantalla cargó.
   * Las subclases para pantallas autenticadas deben sobrescribir para validar
   * que NO hubo redirect a /auth (usar assertAuthenticated()).
   */
  waitForReady() {
    cy.get(this.readySelector, { timeout: 15000 }).should('be.visible');
    return this;
  }

  /**
   * Helper para pantallas autenticadas: asegura que la sesión es válida
   * (no fuimos redirigidos a /auth) antes de evaluar el readySelector.
   */
  assertAuthenticated() {
    cy.url({ timeout: 12000 }).should('not.include', '/auth');
    return this;
  }

  /**
   * Registra un intercept con alias único por página + acción.
   * Evita choques de alias entre tests.
   */
  intercept(alias, method, url) {
    const scopedAlias = `${this.constructor.name}:${alias}`;
    cy.intercept(method, url).as(scopedAlias);
    return scopedAlias;
  }

  /** Espera la resolución de un alias registrado con this.intercept(). */
  waitFor(alias, { status = 200 } = {}) {
    const scopedAlias = `${this.constructor.name}:${alias}`;
    return cy.wait(`@${scopedAlias}`).then(({ response }) => {
      if (response) {
        expect(response.statusCode, `[${scopedAlias}] status`).to.eq(status);
      }
      return response ? response.body : null;
    });
  }

  /**
   * Captura de pantalla con prefijo del nombre de la página.
   * Asegura que el readySelector esté visible antes de capturar, para evitar
   * screenshots de pantallas a medio renderizar (rule: assertion-before-screenshot).
   */
  screenshot(name) {
    cy.get(this.readySelector).should('be.visible');
    cy.screenshot(`${this.constructor.name}-${name}`, { capture: 'viewport' });
    return this;
  }
}
