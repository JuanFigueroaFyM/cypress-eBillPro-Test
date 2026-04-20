// =============================================================================
// UserMenu — Componente del menú de usuario (avatar top-right).
// Usado por cualquier página que necesite hacer logout o acceder a perfil.
// =============================================================================

import SEL from '../../support/selectors';
import { t } from '../../support/i18n';

export default class UserMenu {
  open() {
    // El primer button[aria-haspopup="menu"] puede ser otro componente del layout
    // (selector de idioma, menú de navegación). El menú de usuario está al final
    // del DOM (top-right del header), por eso se usa .last().
    // Si existe data-testid lo usamos directamente.
    cy.get('body').then(($b) => {
      if ($b.find('[data-testid="user-menu-trigger"]').length) {
        cy.get('[data-testid="user-menu-trigger"]').should('be.visible').click();
      } else {
        cy.get('button[aria-haspopup="menu"]').last().should('be.visible').click();
      }
    });
    // Esperar a que el dropdown (Radix DropdownMenu) esté abierto antes de continuar.
    cy.get('[role="menu"]', { timeout: 5000 }).should('exist');
    return this;
  }

  logout() {
    this.open();
    // El menú ya está abierto. Buscar el item de logout.
    cy.get('body').then(($b) => {
      const byTestId = $b.find(SEL.app.logoutBtn);
      if (byTestId.length) {
        cy.wrap(byTestId.first()).click();
      } else {
        // Radix UI DropdownMenu: items con role="menuitem", texto "Cerrar Sesión".
        cy.contains('[role="menuitem"]', new RegExp(t('nav.logout'), 'i')).click();
      }
    });
    cy.url({ timeout: 8000 }).should('include', '/auth');
    return this;
  }
}
