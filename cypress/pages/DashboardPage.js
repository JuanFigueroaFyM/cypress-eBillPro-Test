// =============================================================================
// DashboardPage — Pantalla de inicio (/dashboard).
// Placeholder para cuando se implementen los casos del módulo.
// =============================================================================

import BasePage from './BasePage';
import SEL from '../support/selectors';

export default class DashboardPage extends BasePage {
  get path() {
    return '/dashboard';
  }
  get readySelector() {
    return SEL.dashboard.newDocBtn;
  }

  /** Dashboard es autenticado: validamos que no nos redirijan a /auth. */
  waitForReady() {
    this.assertAuthenticated();
    cy.get('body', { timeout: 15000 }).should('be.visible');
    return this;
  }

  selectMonth(month) {
    cy.intercept('GET', '**/dashboard**').as('DashboardPage:metrics');
    cy.get(SEL.dashboard.monthSelector).click();
    cy.contains(month).click();
    cy.wait('@DashboardPage:metrics');
    return this;
  }

  clickNewDocument() {
    cy.get(SEL.dashboard.newDocBtn).click();
    return this;
  }

  metric(id) {
    return cy.get(SEL.dashboard.metricCard(id));
  }
}
