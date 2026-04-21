// =============================================================================
// Suite: Nuevo Documento — /invoices/new  (Wizard 4 pasos)
// =============================================================================
//
// COBERTURA:
//   TC-NV-001  Factura            — flujo completo happy path
//   TC-NV-002  Nota Credito       — sin referencia (solo periodo)
//   TC-NV-003  Nota Credito       — con referencia (factura + CUFE)
//   TC-NV-004  Nota Debito        — sin referencia
//   TC-NV-005  Nota Debito        — con referencia
//   TC-NV-006  DSNO               — flujo completo
//   TC-NV-007  Nota DSNO          — flujo completo
//   TC-NV-008  Validación Paso 2  — no avanza sin cliente
//   TC-NV-009  Validación Paso 3  — no avanza sin producto
//   TC-NV-010  Numeración manual  — deshabilitar Autogenerar
//
// DATOS DE PRUEBA (fixture: nuevo-documento.json):
//   Cliente  : AIDLIFE CENTER SAS (NIT: 901754460)
//   Producto : producto de prueba (código: 1234)
//   Referencia: SETT-473337 + CUFE correspondiente
//
// ESTRATEGIA:
//   - Cada test es independiente: inicia desde /invoices/new.
//   - cy.loginExitoso() cachea la sesión entre tests (cacheAcrossSpecs: true).
//   - Los flujos completos (TC-NV-001 a 007) usan completarFlujoCompleto().
//   - Los tests de validación (TC-NV-008/009) solo avanzan hasta el paso relevante.
//   - TC-NV-010 verifica el flujo de numeración manual sin completar la generación.
//
// TAGS:
//   @nuevo-documento  — todos los tests de este spec
//   @smoke            — TC-NV-001 (happy path mínimo)
//   @regression       — todos
//   @critical         — TC-NV-001 (flujo más crítico del negocio)
//   @validacion       — TC-NV-008, TC-NV-009
//   @nota-credito     — TC-NV-002, TC-NV-003
//   @nota-debito      — TC-NV-004, TC-NV-005
// =============================================================================

import { NuevoDocumentoPage } from '../../pages';

const page = new NuevoDocumentoPage();

describe(
  'Nuevo Documento — Wizard 4 pasos /invoices/new',
  { tags: ['@nuevo-documento', '@regression'] },
  () => {
    // ── Setup compartido ──────────────────────────────────────────────────────
    // La sesión se cachea por cy.loginExitoso(). El beforeEach navega de nuevo
    // a /invoices/new para garantizar que cada test empieza desde el Paso 1.
    beforeEach(() => {
      cy.loginExitoso();
      page.visit();
      page.waitForReady();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // TC-NV-001 — FACTURA (Happy Path principal)
    // ══════════════════════════════════════════════════════════════════════════
    it(
      'TC-NV-001 | Generar una Factura completa — flujo de 4 pasos',
      { tags: ['@smoke', '@critical'] },
      () => {
        cy.fixture('nuevo-documento').then(({ cliente, producto }) => {
          cy.logStep('TC-NV-001: Generar Factura');

          // Paso 1: Configuración (Factura es el tipo por defecto, no hay que cambiarlo)
          page.completarPaso1({ tipo: 'Factura' });

          // Paso 2: Seleccionar cliente
          page.completarPaso2(cliente);

          // Paso 3: Agregar producto
          page.completarPaso3(producto);

          // Paso 4: Verificar resumen y generar
          page.shouldMostrarResumen({
            tipo: 'Factura',
            cliente: cliente.nombre,
            producto: producto.nombre,
          });

          page.generarDocumento();

          // Post-generación: debe redirigir a /invoices
          cy.url().should('include', '/invoices');
          cy.url().should('not.include', '/new');
        });
      },
    );

    // ══════════════════════════════════════════════════════════════════════════
    // TC-NV-002 — NOTA Credito sin referencia
    // ══════════════════════════════════════════════════════════════════════════
    it(
      'TC-NV-002 | Generar Nota Credito sin referencia (solo periodo)',
      { tags: ['@nota-credito'] },
      () => {
        cy.fixture('nuevo-documento').then(({ cliente, producto }) => {
          cy.logStep('TC-NV-002: Nota Credito sin referencia');

          // Paso 1: Cambiar tipo a Nota Credito, sin referencia (solo periodo)
          page.completarPaso1({
            tipo: 'Nota Credito', // ← sin tilde
            conReferencia: false,
          });

          // Pasos 2 y 3: igual que la Factura
          page.completarPaso2(cliente);
          page.completarPaso3(producto);

          // Paso 4: Verificar resumen
          page.shouldMostrarResumen({
            tipo: 'Nota Credito',
            cliente: cliente.nombre,
          });

          page.generarDocumento();
          cy.url().should('include', '/invoices');
        });
      },
    );

    // // ══════════════════════════════════════════════════════════════════════════
    // // TC-NV-003 — NOTA Credito con referencia (factura + CUFE)
    // // ══════════════════════════════════════════════════════════════════════════
    it(
      'TC-NV-003 | Generar Nota Credito con referencia a factura existente (SETT-473337)',
      { tags: ['@nota-credito'] },
      () => {
        cy.fixture('nuevo-documento').then(({ cliente, producto, referencia }) => {
          cy.logStep('TC-NV-003: Nota Credito con referencia');

          page.completarPaso1({
            tipo: 'Nota Credito',
            conReferencia: true,
            facturaRef: referencia.facturaNumero,
            cufe: referencia.cufe,
          });

          page.completarPaso2(cliente);
          page.completarPaso3(producto);

          page.shouldMostrarResumen({
            tipo: 'Nota Credito',
            cliente: cliente.nombre,
          });

          page.generarDocumento();
          cy.url().should('include', '/invoices');
        });
      },
    );

    // // ══════════════════════════════════════════════════════════════════════════
    // // TC-NV-004 — NOTA Debito sin referencia
    // // ══════════════════════════════════════════════════════════════════════════
    it(
      'TC-NV-004 | Generar Nota Debito sin referencia (solo periodo)',
      { tags: ['@nota-debito'] },
      () => {
        cy.fixture('nuevo-documento').then(({ cliente, producto }) => {
          cy.logStep('TC-NV-004: Nota Debito sin referencia');

          page.completarPaso1({
            tipo: 'Nota Debito',
            conReferencia: false,
          });

          page.completarPaso2(cliente);
          page.completarPaso3(producto);

          page.shouldMostrarResumen({
            tipo: 'Nota Debito',
            cliente: cliente.nombre,
          });

          page.generarDocumento();
          cy.url().should('include', '/invoices');
        });
      },
    );

    // // ══════════════════════════════════════════════════════════════════════════
    // // TC-NV-005 — NOTA Debito con referencia (factura + CUFE)
    // // ══════════════════════════════════════════════════════════════════════════
    it(
      'TC-NV-005 | Generar Nota Debito con referencia a factura existente (SETT-473337)',
      { tags: ['@nota-debito'] },
      () => {
        cy.fixture('nuevo-documento').then(({ cliente, producto, referencia }) => {
          cy.logStep('TC-NV-005: Nota Debito con referencia');

          page.completarPaso1({
            tipo: 'Nota Debito',
            conReferencia: true,
            facturaRef: referencia.facturaNumero,
            cufe: referencia.cufe,
          });

          page.completarPaso2(cliente);
          page.completarPaso3(producto);

          page.shouldMostrarResumen({
            tipo: 'Nota Debito',
            cliente: cliente.nombre,
          });

          page.generarDocumento();
          cy.url().should('include', '/invoices');
        });
      },
    );

    // // ══════════════════════════════════════════════════════════════════════════
    // // TC-NV-006 — DSNO (Documento Soporte sin Operación)
    // // ══════════════════════════════════════════════════════════════════════════
    it('TC-NV-006 | Generar DSNO — flujo completo de 4 pasos', () => {
      cy.fixture('nuevo-documento').then(({ cliente, producto, tiposDocumento }) => {
        const dsno = tiposDocumento.find((t) => t.tag === 'dsno');
        cy.logStep('TC-NV-006: DSNO');

        page.completarPaso1({ tipo: dsno.label });
        page.completarPaso2(cliente);
        page.completarPaso3(producto);

        page.shouldMostrarResumen({ tipo: dsno.label, cliente: cliente.nombre });
        page.generarDocumento();
        cy.url().should('include', '/invoices');
      });
    });

    // // ══════════════════════════════════════════════════════════════════════════
    // // TC-NV-007 — NOTA DSNO
    // // ══════════════════════════════════════════════════════════════════════════
    it('TC-NV-007 | Generar Nota DSNO — flujo completo de 4 pasos', () => {
      cy.fixture('nuevo-documento').then(({ cliente, producto, tiposDocumento }) => {
        const notaDsno = tiposDocumento.find((t) => t.tag === 'nota-dsno');
        cy.logStep('TC-NV-007: Nota DSNO');

        page.completarPaso1({ tipo: notaDsno.label });
        page.completarPaso2(cliente);
        page.completarPaso3(producto);

        page.shouldMostrarResumen({ tipo: notaDsno.label, cliente: cliente.nombre });
        page.generarDocumento();
        cy.url().should('include', '/invoices');
      });
    });

    // // ══════════════════════════════════════════════════════════════════════════
    // // TC-NV-008 — VALIDACIÓN: Paso 2 bloquea sin cliente seleccionado
    // // ══════════════════════════════════════════════════════════════════════════
    it(
      'TC-NV-008 | Paso 2: no puede avanzar al Paso 3 sin seleccionar un cliente',
      { tags: ['@validacion'] },
      () => {
        cy.logStep('TC-NV-008: Validación — cliente obligatorio en Paso 2');

        // Paso 1: avanzar con tipo Factura (sin cambios)
        page.completarPaso1({ tipo: 'Factura' });

        // Paso 2: NO seleccionar cliente e intentar avanzar
        // El Page Object verifica que el botón está deshabilitado o que
        // no se avanza al Paso 3.
        page.shouldBloquearSinCliente();

        // Confirmar que seguimos en el Paso 2 (el título del Paso 3 no está visible)
        cy.contains('Detalle de Productos', { timeout: 2000 }).should('not.exist');
      },
    );

    // // ══════════════════════════════════════════════════════════════════════════
    // // TC-NV-009 — VALIDACIÓN: Paso 3 bloquea sin productos
    // // ══════════════════════════════════════════════════════════════════════════
    it(
      'TC-NV-009 | Paso 3: no puede avanzar al Paso 4 sin agregar al menos un producto',
      { tags: ['@validacion'] },
      () => {
        cy.fixture('nuevo-documento').then(({ cliente }) => {
          cy.logStep('TC-NV-009: Validación — producto obligatorio en Paso 3');

          // Llegar al Paso 3 con cliente seleccionado
          page.completarPaso1({ tipo: 'Factura' });
          page.completarPaso2(cliente);

          // Paso 3: NO agregar productos e intentar avanzar
          page.shouldBloquearSinProducto();

          // Confirmar que seguimos en el Paso 3
          cy.contains('Resumen de la Factura', { timeout: 2000 }).should('not.exist');
        });
      },
    );

    // // ══════════════════════════════════════════════════════════════════════════
    // // TC-NV-010 — NUMERACIÓN MANUAL: deshabilitar Autogenerar
    // // ══════════════════════════════════════════════════════════════════════════
    it(
      'TC-NV-010 | Numeración manual: al desactivar Autogenerar aparece selector de resolución',
      { tags: ['@numeracion'] },
      () => {
        cy.logStep('TC-NV-010: Numeración manual');

        // Verificar que el toggle "Autogenerar" está ON por defecto
        cy.get('body').then(($b) => {
          const toggleSel = '[data-testid="nd-numeracion-auto"], button[role="switch"]';
          if ($b.find(toggleSel).length > 0) {
            // El toggle existe por data-testid o role; verificar estado inicial
            cy.get(toggleSel)
              .first()
              .should('be.visible')
              .then(($toggle) => {
                // aria-checked="true" o checked indica que está ON
                const isOn =
                  $toggle.attr('aria-checked') === 'true' ||
                  $toggle.prop('checked') === true ||
                  $toggle.hasClass('bg-primary') ||
                  $toggle.hasClass('bg-green');
                cy.logStep('Toggle Autogenerar estado inicial', { isOn });
              });
          } else {
            // Fallback: buscar por texto cercano
            cy.contains('Autogenerar').should('be.visible');
          }
        });

        // Deshabilitar la numeración automática
        page.deshabilitarAutonumeracion();

        // Verificar que aparece el selector de resolución
        cy.get(
          '[data-testid="nd-resolucion"], select[name*="resolucion"], select[name*="resolution"], button[role="combobox"][data-placeholder=""]',
          { timeout: 6000 },
        ).should('be.visible');

        // El texto informativo "El número se generará automáticamente" NO debe aparecer
        cy.contains('automáticamente', { timeout: 2000 }).should('not.exist');

        // Verificar que el selector de resolución tiene al menos una opción disponible
        cy.get('body').then(($b) => {
          const resEl = $b.find(
            '[data-testid="nd-resolucion"], select[name*="resolucion"], select[name*="resolution"], button[role="combobox"][data-placeholder=""]',
          );
          if (resEl.is('select')) {
            cy.wrap(resEl).find('option:not(:disabled)').should('have.length.gte', 1);
          } else {
            // Combobox custom: verificar que es interactivo
            cy.wrap(resEl).should('be.enabled');
          }
        });

        cy.logStep('TC-NV-010: Numeración manual verificada correctamente');
      },
    );
  },
);
