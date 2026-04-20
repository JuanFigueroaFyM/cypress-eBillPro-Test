// =============================================================================
// Suite: Clientes — /clients
// -----------------------------------------------------------------------------
// Refactor v2: POM + intercepts (reemplaza cy.wait(800) por espera de API).
// =============================================================================

import { ClientsPage } from '../../pages';

const page = new ClientsPage();

describe('Clientes — /clients', { tags: ['@clients', '@smoke'] }, () => {
  beforeEach(() => {
    cy.loginExitoso();
    page.visit();
  });

  // ── TC-CLI-001 ──────────────────────────────────────────────────────────────
  it('TC-CLI-001 | La lista de clientes carga con registros por defecto', () => {
    page.shouldListAtLeastOne();
  });

  // ── TC-CLI-002 ──────────────────────────────────────────────────────────────
  it('TC-CLI-002 | El filtro reactivo filtra por nombre', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      page.filter(busqueda.nombre_valido);
      page.shouldListClientMatching(busqueda.nombre_valido);
    });
  });

  // ── TC-CLI-003 ──────────────────────────────────────────────────────────────
  it('TC-CLI-003 | El filtro reactivo filtra por NIT / identificación', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      page.filter(busqueda.nit_valido);
      page.shouldListClientMatching(busqueda.nit_valido);
    });
  });

  // ── TC-CLI-004 ──────────────────────────────────────────────────────────────
  it('TC-CLI-004 | El filtro reactivo filtra por email', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      page.filter(busqueda.email_valido);
      page.shouldListClientMatching(busqueda.email_valido);
    });
  });

  // ── TC-CLI-005 ──────────────────────────────────────────────────────────────
  it('TC-CLI-005 | Un filtro sin coincidencias muestra estado vacío', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      page.filter(busqueda.filtro_inexistente);
      page.shouldShowEmptyState();
    });
  });

  // ── TC-CLI-006 ──────────────────────────────────────────────────────────────
  it('TC-CLI-006 | La tabla tiene las columnas esperadas', () => {
    cy.fixture('clients').then(({ columnas }) => {
      page.shouldHaveColumns(columnas);
    });
  });

  // ── TC-CLI-007 ──────────────────────────────────────────────────────────────
  it('TC-CLI-007 | El botón "Nuevo Cliente" está visible', () => {
    page.newButtonShouldBeVisible();
  });

  // ── TC-CLI-008 ──────────────────────────────────────────────────────────────
  it('TC-CLI-008 | Hacer click en un cliente abre el modal de detalle', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      page.filter(busqueda.nit_valido);
      page.openDetailByNit(busqueda.nit_valido);
      page.detailModalShouldShow({ nit: busqueda.nit_valido });
    });
  });
});
