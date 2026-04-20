// =============================================================================
// Suite: Clientes — /clients
// =============================================================================

import ClientsPage from '../../pages/ClientsPage';

describe('Clientes — /clients', { tags: ['@clients', '@smoke'] }, () => {
  beforeEach(() => {
    cy.loginExitoso();
    ClientsPage.visit();
  });

  it('TC-CLI-001 | La lista de clientes carga con registros por defecto', () => {
    ClientsPage.shouldListAtLeastOne();
  });

  it('TC-CLI-002 | El filtro reactivo filtra por nombre', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      ClientsPage.search(busqueda.nombre_valido); // 🔥 antes: filter
      ClientsPage.shouldListClientMatching(busqueda.nombre_valido);
    });
  });

  it('TC-CLI-003 | El filtro reactivo filtra por NIT / identificación', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      ClientsPage.search(busqueda.nit_valido);
      ClientsPage.shouldListClientMatching(busqueda.nit_valido);
    });
  });

  it('TC-CLI-004 | El filtro reactivo filtra por email', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      ClientsPage.search(busqueda.email_valido);
      ClientsPage.shouldListClientMatching(busqueda.email_valido);
    });
  });

  it('TC-CLI-005 | Un filtro sin coincidencias muestra estado vacío', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      ClientsPage.search(busqueda.filtro_inexistente);
      ClientsPage.shouldShowEmptyState();
    });
  });

  it('TC-CLI-006 | La tabla tiene las columnas esperadas', () => {
    ClientsPage.shouldHaveColumns(); // 🔥 ya no necesita fixture
  });

  it('TC-CLI-007 | El botón "Nuevo Cliente" está visible', () => {
    ClientsPage.newButtonShouldBeVisible();
  });

  it('TC-CLI-008 | Hacer click en un cliente abre el modal de detalle', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      ClientsPage.search(busqueda.nit_valido);
      ClientsPage.openDetailByNit(busqueda.nit_valido);
      ClientsPage.detailModalShouldShow({ nit: busqueda.nit_valido });
    });
  });
});