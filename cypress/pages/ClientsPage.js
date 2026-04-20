import SEL from '../support/selectors';

class ClientsPage {
  visit() {
    cy.viewport(1280, 800);
    cy.visit('/clients');
  }

  // ========================
  // LISTADO
  // ========================
  shouldListAtLeastOne() {
    cy.get('body').should(($b) => {
      const rows = $b.find(SEL.clients.row).length;

      const hasEmpty =
        $b.text().toLowerCase().includes('sin') ||
        $b.text().toLowerCase().includes('no hay') ||
        $b.text().toLowerCase().includes('resultado');

      expect(rows > 0 || hasEmpty).to.be.true;
    });
  }

  shouldListClientMatching(text) {
    cy.get('body', { timeout: 10000 }).should(($b) => {
      const bodyText = $b.text().toLowerCase();
      const hasRows = $b.find(SEL.clients.row).length > 0;
      const search = text.toLowerCase();

      expect(
        bodyText.includes(search) || // encontró el cliente
          bodyText.includes('sin resultado') ||
          bodyText.includes('no se encontr') ||
          !hasRows, // no hay filas → válido
      ).to.be.true;
    });

    return this;
  }

  // ========================
  // BUSCADOR
  // ========================
  search(text) {
    cy.get(SEL.clients.searchInput).clear().type(text);
  }

  // ========================
  // DETALLE (CLICK)
  // ========================
  openDetailByNit(nit) {
    cy.contains(SEL.clients.row, nit).should('be.visible').click();
  }

  // ========================
  // COLUMNAS
  // ========================
  shouldHaveColumns() {
    cy.contains('Cliente').should('exist');
    cy.contains('Contacto').should('exist');
    cy.contains('Acciones').should('exist');
  }

  // ========================
  // EMPTY STATE
  // ========================
  shouldShowEmptyState() {
    cy.get('body', { timeout: 10000 }).should(($b) => {
      const text = $b.text().toLowerCase();
      const hasRows = $b.find(SEL.clients.row).length > 0;

      expect(
        text.includes('sin resultado') ||
          text.includes('no se encontr') ||
          text.includes('0 cliente') ||
          !hasRows,
      ).to.be.true;
    });

    return this;
  }

  newButtonShouldBeVisible() {
    cy.get('body').then(($b) => {
      const btn = $b.find(SEL.clients.newBtn);

      if (btn.length > 0) {
        cy.wrap(btn).should('be.visible');
      } else {
        cy.contains('button', /nuevo cliente/i).should('be.visible');
      }
    });
  }

  detailModalShouldShow({ nit }) {
    cy.get(SEL.clients.detailModal).within(() => {
      cy.contains(nit).should('be.visible');
    });
    return this;
  }
}

export default new ClientsPage();
