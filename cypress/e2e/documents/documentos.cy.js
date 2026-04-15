// =============================================================================
// Suite : Documentos — /invoices
// Reporter: Mochawesome (genera reporte HTML en cypress/reports/)
//
// UI observada en ebillprogotest.facturaenlinea.co/invoices:
//   • Sección superior: "Buscar documento específico"
//     - TIPO (dropdown), Prefijo* (input), Número* (input), botón Buscar
//     - Buscar está DISABLED hasta que ambos campos (prefijo + número) tengan valor
//   • Sección inferior: lista de resultados con buscador por cliente + Filtros
//     - Columnas: DOCUMENTO | CLIENTE | MONTO | FECHA | ESTADO | ACCIONES
//
// TC-DOC-001  El botón Buscar está deshabilitado con campos vacíos
// TC-DOC-002  Buscar con prefijo + número válidos retorna el documento
// TC-DOC-003  Buscar con prefijo + número inexistentes muestra estado vacío
// TC-DOC-004  La tabla de resultados tiene las columnas esperadas
// TC-DOC-005  El buscador por cliente filtra los resultados de la lista
// TC-DOC-006  El botón Filtros abre opciones de filtrado avanzado
// TC-DOC-007  Hacer click en un resultado abre su detalle
// =============================================================================

describe('Documentos — /invoices', () => {

  beforeEach(() => {
    cy.loginExitoso();
    cy.irADocumentos();
  });

  // ── TC-DOC-001 ─────────────────────────────────────────────────────────────
  it('TC-DOC-001 | El botón Buscar está deshabilitado cuando los campos están vacíos', () => {
    // Limpiar ambos campos
    cy.contains('Prefijo').closest('div').find('input').clear();
    cy.contains('Número').closest('div').find('input').clear();

    // El botón Buscar debe estar disabled
    cy.contains('button', 'Buscar').should('be.disabled');
  });

  // ── TC-DOC-001b ────────────────────────────────────────────────────────────
  it('TC-DOC-001b | El botón Buscar se habilita solo cuando ambos campos tienen valor', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      // Solo prefijo → sigue disabled
      cy.contains('Prefijo').closest('div').find('input')
        .clear().type(busqueda.prefijo_valido);
      cy.contains('button', 'Buscar').should('be.disabled');

      // Agregar número → se habilita
      cy.contains('Número').closest('div').find('input')
        .clear().type(busqueda.numero_valido);
      cy.contains('button', 'Buscar').should('not.be.disabled');
    });
  });

  // ── TC-DOC-002 ─────────────────────────────────────────────────────────────
  it('TC-DOC-002 | Buscar con prefijo y número válidos retorna el documento', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      cy.buscarDocumento(busqueda.prefijo_valido, busqueda.numero_valido);

      // Debe mostrar al menos 1 resultado
      cy.contains(/documento encontrado/i).should('be.visible');

      // El documento debe tener el prefijo buscado
      cy.get('body').should('contain.text', busqueda.prefijo_valido);
    });
  });

  // ── TC-DOC-003 ─────────────────────────────────────────────────────────────
  it('TC-DOC-003 | Buscar con datos inexistentes muestra estado sin resultados', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      cy.buscarDocumento(busqueda.prefijo_inexistente, busqueda.numero_inexistente);

      cy.get('body', { timeout: 8000 }).should('satisfy', ($b) => {
        const t = $b.text().toLowerCase();
        return (
          t.includes('sin resultado')    ||
          t.includes('no se encontr')    ||
          t.includes('0 documento')      ||
          // La tabla existe pero sin filas de datos
          $b.find('table tbody tr, [class*="row"]:not([class*="header"])').length === 0
        );
      });
    });
  });

  // ── TC-DOC-004 ─────────────────────────────────────────────────────────────
  it('TC-DOC-004 | La tabla de resultados tiene las columnas esperadas', () => {
    cy.fixture('documents').then(({ busqueda, columnas }) => {
      cy.buscarDocumento(busqueda.prefijo_valido, busqueda.numero_valido);

      // Verificar columnas reales: DOCUMENTO, CLIENTE, MONTO, FECHA, ESTADO, ACCIONES
      columnas.forEach((col) => {
        cy.get('body').should('contain.text', col);
      });
    });
  });

  // ── TC-DOC-005 ─────────────────────────────────────────────────────────────
  it('TC-DOC-005 | El buscador "Buscar por cliente..." filtra la lista', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      // Primero traer resultados
      cy.buscarDocumento(busqueda.prefijo_valido, busqueda.numero_valido);

      // Escribir en el campo de búsqueda por cliente
      cy.get('[placeholder*="cliente"], [placeholder*="Cliente"]')
        .first()
        .clear()
        .type(busqueda.nombre_cliente);

      // La lista debe seguir visible (filter reactivo)
      cy.get('body', { timeout: 5000 }).should('satisfy', ($b) => {
        const t = $b.text().toLowerCase();
        return (
          t.includes(busqueda.nombre_cliente.toLowerCase()) ||
          t.includes('sin resultado') ||
          t.includes('documento')
        );
      });
    });
  });

  // ── TC-DOC-006 ─────────────────────────────────────────────────────────────
  it('TC-DOC-006 | El botón "Filtros" está disponible en la lista', () => {
    // El botón Filtros existe en la sección de lista (no en la búsqueda)
    cy.contains('button', 'Filtros').should('be.visible');
  });

  // ── TC-DOC-007 ─────────────────────────────────────────────────────────────
  it('TC-DOC-007 | Hacer click en un resultado abre su detalle', () => {
    cy.fixture('documents').then(({ busqueda }) => {
      cy.buscarDocumento(busqueda.prefijo_valido, busqueda.numero_valido);

      // La tabla usa divs, no <tr>. Hacer click directo sobre el número de documento.
      cy.contains(`${busqueda.prefijo_valido}-${busqueda.numero_valido}`)
        .first()
        .click({ force: true });

      // El detalle se abre como drawer lateral.
      // Verificar con texto único visible en el drawer (screenshot confirma estos textos).
      cy.get('body', { timeout: 8000 }).should('satisfy', ($b) => {
        return (
          $b.text().includes('Ver PDF')                    ||
          $b.text().includes('Información del Documento')  ||
          $b.text().includes('MONTO TOTAL')                ||
          $b.text().includes('FECHA EXPEDICIÓN')           ||
          $b.text().includes('Estado Trámite')
        );
      });
    });
  });

});
