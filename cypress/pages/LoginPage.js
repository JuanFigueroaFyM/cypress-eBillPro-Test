// =============================================================================
// LoginPage — Página de autenticación (/auth).
// =============================================================================

import BasePage from './BasePage';
import SEL from '../support/selectors';

export default class LoginPage extends BasePage {
  get path() {
    return '/auth';
  }
  get readySelector() {
    return SEL.login.password;
  }

  /**
   * waitForReady de login: además de ver el input de contraseña, asegura que
   * la URL SÍ esté en /auth (opuesto a las pantallas autenticadas).
   */
  waitForReady() {
    cy.url({ timeout: 12000 }).should('include', '/auth');
    cy.get(this.readySelector, { timeout: 15000 }).should('be.visible');
    return this;
  }

  /** Campo de username: tolera que el selector combinado devuelva múltiples. */
  usernameField() {
    return cy.get(SEL.login.username).first();
  }

  passwordField() {
    return cy.get(SEL.login.password).first();
  }

  submitButton() {
    return cy.get(SEL.login.submit).first();
  }

  /** Llena usuario y contraseña (sin submit). */
  fill({ username, password }) {
    if (username !== undefined) {
      this.usernameField().clear();
      if (username !== '') this.usernameField().type(username, { delay: 0 });
    }
    if (password !== undefined) {
      this.passwordField().clear();
      if (password !== '') this.passwordField().type(password, { delay: 0, log: false });
    }
    return this;
  }

  /** Click en el botón de submit. */
  submit() {
    this.submitButton().should('be.enabled').click();
    return this;
  }

  /** Flujo completo: fill + submit. */
  login({ username, password }) {
    return this.fill({ username, password }).submit();
  }

  /** Intercepta el request de login para aserciones posteriores. */
  interceptLogin() {
    cy.intercept('POST', '**/auth/**').as('LoginPage:login');
    cy.intercept('POST', '**/login**').as('LoginPage:login-alt');
    cy.intercept('POST', '**/session**').as('LoginPage:login-session');
    return this;
  }

  // ─── Aserciones ──────────────────────────────────────────────────────────

  shouldShowError() {
    cy.get(SEL.login.error, { timeout: 8000 }).first().should('be.visible').and('not.be.empty');
    return this;
  }

  shouldNotRevealUserExistence() {
    cy.get('body').should('not.contain.text', 'no existe').and('not.contain.text', 'not found');
    return this;
  }

  shouldStillBeOnLogin() {
    cy.url().should('include', '/auth');
    this.passwordField().should('be.visible');
    return this;
  }

  shouldHaveRedirectedAway() {
    cy.url({ timeout: 12000 }).should('not.include', '/auth');
    return this;
  }

  passwordFieldShouldBeMasked() {
    this.passwordField().should('have.attr', 'type', 'password');
    return this;
  }

  submitShouldBeDisabled() {
    this.submitButton().should('be.disabled');
    return this;
  }
}
