// =============================================================================
// DocumentsPage — Módulo de documentos (/invoices).
// =============================================================================
//
// ARQUITECTURA DE LA UI (ebillprogotest.facturaenlinea.co/invoices):
//
//  ┌─────────────────────────────────────────────────────────────────────┐
//  │  [Buscar por cliente...] [Filtros ▼] [✕]                          │
//  ├─────────────────────────────────────────────────────────────────────┤
//  │  (Panel filtros avanzados — visible solo tras click en "Filtros")  │
//  │   NÚMERO DE DOCUMENTO   TIPO DE DOCUMENTO   FECHA                  │
//  ├─────────────────────────────────────────────────────────────────────┤
//  │  73 documentos encontrados • Página 1 de 8   [Ordenar por: Fecha]  │
//  │                                                                     │
//  │  <div tracking-widest> Documento Cliente Monto Fecha Estado Accs   │
//  │  <div cursor-pointer animate-fade-in> SETT-473337 | ...            │
//  │  <div cursor-pointer animate-fade-in> SETT-25833 | ...             │
//  └─────────────────────────────────────────────────────────────────────┘
//
// CLAVES DE IMPLEMENTACIÓN:
//  - Filtros REACTIVOS: no hay botón "Buscar". La lista se actualiza sola.
//  - La lista usa <div> con Tailwind, NO <table>/<tr>/<tbody>.
//  - Filas de datos: div[class*="cursor-pointer"][class*="animate-fade-in"]
//  - Encabezado de columnas: div[class*="tracking-widest"] > span
//  - El drawer de detalle se monta dinámicamente (no existe en el HTML inicial).
// =============================================================================

import BasePage from './BasePage';
import SEL from '../support/selectors';
import { t } from '../support/i18n';

export default class DocumentsPage extends BasePage {
  get path() {
    return '/invoices';
  }

  get readySelector() {
    return SEL.documents.clientFilter;
  }

  /** Espera a que la página esté lista (autenticada y con el input de cliente visible). */
  waitForReady() {
    this.assertAuthenticated();
    cy.get(SEL.documents.clientFilter, { timeout: 15000 }).should('be.visible');
    return this;
  }

  // ─── Panel de filtros avanzados ──────────────────────────────────────────

  /**
   * Abre el panel de filtros avanzados (si no está ya visible).
   * Detecta si el input de NÚMERO DE DOCUMENTO ya está en el DOM antes de hacer click.
   */
  openFiltersPanel() {
    cy.get('body').then(($b) => {
      const panelOpen = $b.find(SEL.documents.docNumberInput).length > 0;
      if (!panelOpen) {
        this._clickFiltersBtn();
        cy.get(SEL.documents.docNumberInput, { timeout: 8000 }).should('be.visible');
      }
    });
    return this;
  }

  /** Cierra el panel de filtros si está abierto. */
  closeFiltersPanel() {
    cy.get('body').then(($b) => {
      if ($b.find(SEL.documents.docNumberInput).length > 0) {
        this._clickFiltersBtn();
      }
    });
    return this;
  }

  /** Click al botón "Filtros" (por data-testid o por texto visible). */
  _clickFiltersBtn() {
    cy.get('body').then(($b) => {
      if ($b.find(SEL.documents.filtersBtn).length > 0) {
        cy.get(SEL.documents.filtersBtn).first().click();
      } else {
        cy.contains('button', t('doc.filters.toggle')).click();
      }
    });
    return this;
  }

  // ─── Búsqueda / Filtros ──────────────────────────────────────────────────

  /**
   * Filtra la lista por nombre de cliente (input siempre visible, reactivo).
   * No requiere abrir el panel de filtros.
   */
  filterByClient(texto) {
    cy.get(SEL.documents.clientFilter).first().clear().type(texto);
    return this;
  }

  /**
   * Busca un documento por su número completo (ej: "SETT-473337").
   *
   * Flujo:
   *   1. Abre el panel de filtros avanzados.
   *   2. Escribe el número en el campo NÚMERO DE DOCUMENTO.
   *   3. Presiona Enter (por si el campo no filtra en onChange).
   *   4. Espera a que la lista actualice.
   *
   * @param {object} opts
   *   - numeroDocumento {string}  Número completo ej: "SETT-473337"   (preferido)
   *   - prefijo         {string}  Prefijo, se une con numero si no hay numeroDocumento
   *   - numero          {string}  Número sin prefijo
   */
  searchSpecific({ numeroDocumento, prefijo, numero }) {
    const query = numeroDocumento || `${prefijo}-${numero}`;

    this.openFiltersPanel();

    cy.get(SEL.documents.docNumberInput)
      .first()
      .clear()
      .type(query)
      .type('{enter}');

    // Espera breve para que la lista reaccione (debounce del filtro).
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);

    return this;
  }

  /**
   * Limpia los campos de búsqueda activos.
   */
  clearSearchFields() {
    cy.get(SEL.documents.clientFilter).first().clear();

    cy.get('body').then(($b) => {
      if ($b.find(SEL.documents.docNumberInput).length > 0) {
        cy.get(SEL.documents.docNumberInput).first().clear().type('{enter}');
      }
    });

    return this;
  }

  // ─── Interacción con resultados ──────────────────────────────────────────

  /**
   * Hace click en la primera fila de resultados y espera que aparezca el detalle.
   * El drawer se monta dinámicamente, por eso se verifica por contenido de texto.
   */
  openFirstResult() {
    // eslint-disable-next-line cypress/no-force
    cy.get(SEL.documents.resultRow, { timeout: 12000 })
      .first()
      .click({ force: true });

    // Verificar que se abrió el detalle buscando textos que siempre aparecen en él.
    cy.contains('Ver PDF', { timeout: 10000 }).should('be.visible');
    return this;
  }

  // ─── Aserciones ──────────────────────────────────────────────────────────

  /**
   * Verifica que la lista tiene al menos una fila de resultado.
   * Las filas son div con cursor-pointer y animate-fade-in (no <tr>).
   */
  shouldHaveAtLeastOneResult() {
    cy.get(SEL.documents.resultRow, { timeout: 12000 }).should('have.length.gte', 1);
    return this;
  }

  shouldHaveResults(count) {
    cy.get(SEL.documents.resultRow, { timeout: 12000 }).should('have.length', count);
    return this;
  }

  /**
   * Verifica el estado vacío. Puede aparecer como texto "Sin resultados"
   * o como ausencia total de filas.
   */
  shouldShowEmptyState() {
    cy.get('body').then(($b) => {
      if ($b.find(SEL.documents.resultEmpty).length > 0) {
        cy.get(SEL.documents.resultEmpty, { timeout: 10000 }).should('be.visible');
      } else if ($b.find(SEL.documents.resultRow).length === 0) {
        // No hay filas → OK, la lista está vacía.
        cy.get(SEL.documents.resultRow).should('not.exist');
      } else {
        // Fallback: buscar texto de estado vacío.
        cy.contains(/sin resultado|no se encontr|0 documento/i, { timeout: 10000 })
          .should('be.visible');
      }
    });
    return this;
  }

  /**
   * Verifica que los encabezados de las columnas esperadas son visibles.
   * Los encabezados son <span> dentro de un <div class="...tracking-widest...">
   * (el app usa divs Tailwind, no <th>).
   */
  shouldHaveColumns(columns) {
    columns.forEach((col) => {
      // Intentar primero por data-testid; si no, buscar dentro del div de encabezado.
      cy.get('body').then(($b) => {
        const byTestId = $b.find(`[data-testid="doc-col-${col.toLowerCase()}"]`);
        if (byTestId.length > 0) {
          cy.wrap(byTestId.first()).should('be.visible');
        } else {
          // El encabezado de columnas usa div[class*="tracking-widest"] > span
          cy.contains(SEL.documents.resultTable, col, { matchCase: false })
            .should('be.visible');
        }
      });
    });
    return this;
  }

  /**
   * Verifica que el drawer de detalle muestra el número del documento y el botón PDF.
   * El drawer se detecta por textos visibles ya que no tiene data-testid en el FE actual.
   */
  detailDrawerShouldBeVisibleWith({ numeroDocumento, prefijo, numero }) {
    const docRef = numeroDocumento || `${prefijo}-${numero}`;

    // El detalle aparece como overlay en el body. Verificamos textos clave.
    cy.get('body', { timeout: 10000 }).should('satisfy', ($b) => {
      const text = $b.text();
      return (
        text.includes('Ver PDF') ||
        text.includes('Información del Documento') ||
        text.includes('MONTO TOTAL') ||
        text.includes('FECHA EXPEDICIÓN')
      );
    });

    // El número del documento también debe aparecer en el detalle.
    cy.contains(docRef, { timeout: 10000 }).should('be.visible');

    return this;
  }

  /**
   * Verifica que el botón "Filtros" está visible y habilitado.
   */
  filtersToggleShouldBeVisible() {
    cy.get('body').then(($b) => {
      if ($b.find(SEL.documents.filtersBtn).length > 0) {
        cy.get(SEL.documents.filtersBtn).first().should('be.visible').and('be.enabled');
      } else {
        cy.contains('button', t('doc.filters.toggle')).should('be.visible').and('be.enabled');
      }
    });
    return this;
  }

  /**
   * Verifica que la lista inicial (sin filtros) tiene al menos un resultado.
   */
  shouldShowInitialResults() {
    cy.get(SEL.documents.resultRow, { timeout: 12000 }).should('have.length.gte', 1);
    return this;
  }
}
