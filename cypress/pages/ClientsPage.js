// =============================================================================
// ClientsPage — Módulo de clientes (/clients).
// =============================================================================

import BasePage from './BasePage';
import SEL from '../support/selectors';
import { t } from '../support/i18n';

export default class ClientsPage extends BasePage {
  get path() {
    return '/clients';
  }
  get readySelector() {
    return SEL.clients.listTable;
  }

  /** Pantalla autenticada: validamos que no nos redirijan a /auth. */
  waitForReady() {
    this.assertAuthenticated();
    cy.get('body', { timeout: 15000 }).should('be.visible');
    return this;
  }

  /**
   * Aplica filtro reactivo. No espera un endpoint específico (la URL real
   * puede variar); la condición de éxito se verifica con aserciones en el test.
   */
  filter(text) {
    cy.get(SEL.clients.searchInput).first().clear();
    cy.get(SEL.clients.searchInput).first().type(text);
    return this;
  }

  openDetailByNit(nit) {
    // Intenta por data-testid; si no existe (frontend sin atributos), busca
    // la primera fila de la tabla que contenga el NIT como texto.
    cy.get('body').then(($b) => {
      if ($b.find(SEL.clients.rowByNit(nit)).length) {
        cy.get(SEL.clients.rowByNit(nit), { timeout: 8000 }).first().click();
      } else {
        cy.contains(SEL.clients.row, nit, { timeout: 8000 }).first().click();
      }
    });
    cy.get(SEL.clients.detailModal, { timeout: 8000 }).should('be.visible');
    return this;
  }

  clickNew() {
    cy.get(SEL.clients.newBtn).click();
    cy.get(SEL.clients.form.root, { timeout: 8000 }).should('be.visible');
    return this;
  }

  submitNew({ nit, name, email }) {
    cy.intercept('POST', '**/clients**').as('ClientsPage:create');
    cy.get(SEL.clients.form.nit).clear();
    cy.get(SEL.clients.form.nit).type(nit);
    cy.get(SEL.clients.form.name).clear();
    cy.get(SEL.clients.form.name).type(name);
    cy.get(SEL.clients.form.email).clear();
    cy.get(SEL.clients.form.email).type(email);
    cy.get(SEL.clients.form.submit).click();
    cy.wait('@ClientsPage:create').its('response.statusCode').should('be.oneOf', [200, 201]);
    return this;
  }

  // ─── Aserciones ──────────────────────────────────────────────────────────

  shouldListAtLeastOne() {
    cy.get(SEL.clients.row, { timeout: 10000 }).should('have.length.gte', 1);
    return this;
  }

  shouldShowEmptyState() {
    // El selector ya incluye fallbacks PrimeVue (.p-datatable-emptymessage).
    // Si ninguno aplica, busca el texto vacío configurado en i18n.
    cy.get('body', { timeout: 10000 }).then(($b) => {
      if ($b.find(SEL.clients.emptyState).length) {
        cy.get(SEL.clients.emptyState).should('be.visible');
      } else {
        cy.contains(t('client.list.empty')).should('be.visible');
      }
    });
    return this;
  }

  shouldListClientMatching(text) {
    cy.get(SEL.clients.row, { timeout: 10000 })
      .filter(`:contains("${text}")`)
      .should('have.length.gte', 1);
    return this;
  }

  shouldHaveColumns(columns) {
    columns.forEach((col) => {
      const colId = col.toLowerCase();
      cy.get('body').then(($b) => {
        const byTestId = $b.find(`[data-testid="clients-col-${colId}"]`);
        if (byTestId.length) {
          cy.wrap(byTestId.first()).should('be.visible');
        } else {
          cy.contains(SEL.clients.listTable, col, { matchCase: false }).should('be.visible');
        }
      });
    });
    return this;
  }

  newButtonShouldBeVisible() {
    // Intenta por data-testid; si el frontend no lo expone, busca el botón
    // por su texto visible ("Nuevo Cliente").
    cy.get('body').then(($b) => {
      if ($b.find(SEL.clients.newBtn).length) {
        cy.get(SEL.clients.newBtn).should('be.visible');
      } else {
        cy.contains('button', t('client.list.newBtn')).should('be.visible');
      }
    });
    return this;
  }

  detailModalShouldShow({ nit }) {
    cy.get(SEL.clients.detailModal).within(() => {
      cy.get(SEL.clients.detailTitle).should('contain.text', t('client.detail.title'));
      cy.contains(nit).should('be.visible');
    });
    return this;
  }
}
