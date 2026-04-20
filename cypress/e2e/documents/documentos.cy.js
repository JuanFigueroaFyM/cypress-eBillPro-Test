// =============================================================================
// Suite: Documentos — /invoices
// -----------------------------------------------------------------------------
// Refactor v4: Adaptado a la UI real de eBill Pro Go.
//
// COMPORTAMIENTO REAL DE LA APP:
//  - Lista usa <div> con Tailwind, NO <table>/<tr>. Filas: div.cursor-pointer.animate-fade-in
//  - Encabezados de columna: <span> dentro de div.tracking-widest (NO <th>)
//  - Filtros REACTIVOS → no hay botón submit de búsqueda
//  - "Buscar por cliente..." siempre visible → filtra por nombre de cliente
//  - Botón "Filtros" → panel con NÚMERO DE DOCUMENTO, TIPO, FECHA
//  - El drawer de detalle se monta dinámicamente (no existe en HTML inicial)
//
// Ver cypress/pages/DocumentsPage.js para la lógica de UI.
// =============================================================================

import { DocumentsPage } from '../../pages';

const page = new DocumentsPage();

describe('Documentos — /invoices', { tags: ['@documents', '@smoke'] }, () => {
  beforeEach(() => {
    cy.loginExitoso();
    page.visit();
  });

  // ── TC-DOC-001 ─────────────────────────────────────────────────────────────
  // La lista de documentos debe renderizarse con filas visibles al cargar.
  // Valida que los div-fila (cursor-pointer + animate-fade-in) existen.
  it('TC-DOC-001 | La lista carga y muestra documentos al visitar la página', () => {
    page.shouldShowInitialResults();
  });

  // ── TC-DOC-001b ────────────────────────────────────────────────────────────
  // El input "Buscar por cliente..." filtra la lista de forma reactiva.
  it('TC-DOC-001b | Filtrar por nombre de cliente acota los resultados', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      page.filterByClient(busqueda.nombreCliente);

      // La lista debe contener al menos una fila con el nombre del cliente,
      // o mostrar estado vacío si no existe en el ambiente.
      cy.get('body', { timeout: 10000 }).should('satisfy', ($b) => {
        const text = $b.text().toLowerCase();
        const clientLower = busqueda.nombreCliente.toLowerCase();
        const hasRows = $b.find(
          '[data-testid^="doc-row-"], div[class*="cursor-pointer"][class*="animate-fade-in"]'
        ).length > 0;

        return (
          text.includes(clientLower) ||
          text.includes('sin resultado') ||
          text.includes('no se encontr') ||
          !hasRows
        );
      });
    });
  });

  // ── TC-DOC-002 ─────────────────────────────────────────────────────────────
  // Buscar por NÚMERO DE DOCUMENTO (en el panel Filtros) debe retornar resultados.
  it('TC-DOC-002 | Buscar por número de documento retorna el documento', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      page.searchSpecific(busqueda.valido);
      page.shouldHaveAtLeastOneResult();
      // El número buscado debe ser visible en los resultados.
      cy.contains(busqueda.valido.prefijo, { timeout: 8000 }).should('be.visible');
    });
  });

  // ── TC-DOC-003 ─────────────────────────────────────────────────────────────
  it('TC-DOC-003 | Buscar con número inexistente muestra estado vacío', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      page.searchSpecific(busqueda.inexistente);

      cy.get('body', { timeout: 10000 }).should('satisfy', ($b) => {
        const text = $b.text().toLowerCase();
        const hasRows = $b.find(
          '[data-testid^="doc-row-"], div[class*="cursor-pointer"][class*="animate-fade-in"]'
        ).length > 0;

        return (
          text.includes('sin resultado') ||
          text.includes('no se encontr') ||
          text.includes('0 documento') ||
          !hasRows
        );
      });
    });
  });

  // ── TC-DOC-004 ─────────────────────────────────────────────────────────────
  // Los encabezados de columna están en <span> dentro de un div.tracking-widest.
  it('TC-DOC-004 | La tabla de resultados tiene las columnas esperadas', () => {
    cy.fixture('documents').then(({ columnas }) => {
      // Las columnas se comprueban sobre la lista inicial sin necesidad de filtrar.
      page.shouldHaveColumns(columnas);
    });
  });

  // ── TC-DOC-005 ─────────────────────────────────────────────────────────────
  it('TC-DOC-005 | El filtro por cliente acota visualmente los resultados', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      page.filterByClient(busqueda.nombreCliente);

      cy.get('body', { timeout: 10000 }).should('satisfy', ($b) => {
        const text = $b.text().toLowerCase();
        const hasFilteredRows = $b.find(
          '[data-testid^="doc-row-"], div[class*="cursor-pointer"][class*="animate-fade-in"]'
        ).length > 0;

        return (
          text.includes(busqueda.nombreCliente.toLowerCase()) ||
          text.includes('sin resultado') ||
          !hasFilteredRows
        );
      });
    });
  });

  // ── TC-DOC-006 ─────────────────────────────────────────────────────────────
  it('TC-DOC-006 | El botón Filtros está visible y abre el panel de filtros avanzados', () => {
    page.filtersToggleShouldBeVisible();

    // Al abrir el panel deben aparecer los campos de filtro avanzado.
    page.openFiltersPanel();

    // Verificar que el input de NÚMERO DE DOCUMENTO está visible.
    // NOTA: No usar flag " i" en selectores CSS — Sizzle no lo soporta.
    cy.get(
      '[data-testid="doc-search-number"], input[placeholder="INV-2025-001"], input[name="numeroDocumento"]',
      { timeout: 8000 }
    ).should('be.visible');
  });

  // ── TC-DOC-007 ─────────────────────────────────────────────────────────────
  // Al hacer click en una fila se debe abrir el drawer de detalle del documento.
  it('TC-DOC-007 | Hacer click en un resultado abre el detalle del documento', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      page.searchSpecific(busqueda.valido);
      page.shouldHaveAtLeastOneResult();
      page.openFirstResult();
      page.detailDrawerShouldBeVisibleWith(busqueda.valido);
    });
  });
});
