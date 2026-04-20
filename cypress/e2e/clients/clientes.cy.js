// =============================================================================
// Suite : Clientes — /clients
// Reporter: Mochawesome
//
// UI actual (verificada en capturas 17-abr-2026):
//   • Lista carga TODOS los clientes por defecto (ej: "1-9 de 169 clientes")
//   • Un solo campo de búsqueda reactivo (sin botón):
//     placeholder: "Buscar clientes por identificación o email..."
//   • Filtro aplica sin hacer click — solo con escribir
//   • Columnas: Cliente | Contacto | Acciones  (CSS uppercase en UI)
//   • Cada fila: "NIT-NOMBRE" + id interno (#XXX) | email | acciones
//   • Botón top-right: "Nuevo Cliente"
//   • Modal detalle: "Detalles del Cliente"
//
// TC-CLI-001  La lista de clientes carga con registros por defecto
// TC-CLI-002  El filtro reactivo funciona por nombre
// TC-CLI-003  El filtro reactivo funciona por NIT / identificación
// TC-CLI-004  El filtro reactivo funciona por email
// TC-CLI-005  Un filtro sin coincidencias muestra estado vacío
// TC-CLI-006  La tabla tiene las columnas esperadas
// TC-CLI-007  El botón "Nuevo Cliente" está visible
// TC-CLI-008  Hacer click en un cliente abre el modal de detalle
// =============================================================================

describe('Clientes — /clients', () => {

  beforeEach(() => {
    cy.loginExitoso();
    cy.irAClientes();
  });

  // ── TC-CLI-001 ──────────────────────────────────────────────────────────────
  it('TC-CLI-001 | La lista de clientes carga con registros por defecto', () => {
    cy.url().should('not.include', '/auth');

    // Debe mostrar el contador de clientes (ej: "1-9 de 169 clientes")
    cy.get('body', { timeout: 10000 }).should('satisfy', ($b) => {
      const t = $b.text().toLowerCase();
      return t.includes('clientes') || t.includes('cliente');
    });

    // Debe haber al menos una fila visible en la lista
    cy.get('body').should('satisfy', ($b) =>
      $b.text().toLowerCase().includes('de 1') ||
      $b.text().match(/\d+ clientes/)
    );
  });

  // ── TC-CLI-002 ──────────────────────────────────────────────────────────────
  it('TC-CLI-002 | El filtro reactivo filtra por nombre', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      cy.filtrarClientes(busqueda.nombre_valido);

      cy.get('body', { timeout: 8000 }).should('satisfy', ($b) => {
        const t = $b.text().toLowerCase();
        return t.includes(busqueda.nombre_valido.toLowerCase());
      });
    });
  });

  // ── TC-CLI-003 ──────────────────────────────────────────────────────────────
  it('TC-CLI-003 | El filtro reactivo filtra por NIT / identificación', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      cy.filtrarClientes(busqueda.nit_valido);

      cy.get('body', { timeout: 8000 }).should('satisfy', ($b) =>
        $b.text().includes(busqueda.nit_valido)
      );
    });
  });

  // ── TC-CLI-004 ──────────────────────────────────────────────────────────────
  it('TC-CLI-004 | El filtro reactivo filtra por email', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      cy.filtrarClientes(busqueda.email_valido);

      cy.get('body', { timeout: 8000 }).should('satisfy', ($b) =>
        $b.text().includes(busqueda.email_valido)
      );
    });
  });

  // ── TC-CLI-005 ──────────────────────────────────────────────────────────────
  it('TC-CLI-005 | Un filtro sin coincidencias muestra estado vacío', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      cy.filtrarClientes(busqueda.filtro_inexistente);

      cy.get('body', { timeout: 8000 }).should('satisfy', ($b) => {
        const t = $b.text().toLowerCase();
        return (
          t.includes('sin resultado')    ||
          t.includes('no se encontr')    ||
          t.includes('no hay cliente')   ||
          t.includes('0 cliente')        ||
          t.includes('0 de')             ||
          t.match(/0\s+clientes/)
        );
      });
    });
  });

  // ── TC-CLI-006 ──────────────────────────────────────────────────────────────
  it('TC-CLI-006 | La tabla tiene las columnas esperadas', () => {
    cy.fixture('clients').then(({ columnas }) => {
      // Las columnas usan CSS uppercase; DOM text es "Cliente", "Contacto", "Acciones"
      columnas.forEach((col) => {
        cy.get('body').should('contain.text', col);
      });
    });
  });

  // ── TC-CLI-007 ──────────────────────────────────────────────────────────────
  it('TC-CLI-007 | El botón "Nuevo Cliente" está visible', () => {
    cy.contains('Nuevo Cliente').should('be.visible');
  });

  // ── TC-CLI-008 ──────────────────────────────────────────────────────────────
  it('TC-CLI-008 | Hacer click en un cliente abre el modal de detalle', () => {
    cy.fixture('clients').then(({ busqueda }) => {
      cy.filtrarClientes(busqueda.nit_valido);

      // Esperar a que aparezca el cliente y hacer click
      cy.contains(busqueda.nit_valido, { timeout: 8000 })
        .first()
        .click({ force: true });

      // Modal "Detalles del Cliente" debe aparecer
      cy.contains('Detalles del Cliente', { timeout: 8000 }).should('be.visible');
      cy.get('body').should('contain.text', 'NIT');
      cy.get('body').should('contain.text', 'Email');
    });
  });

});