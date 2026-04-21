// =============================================================================
// NuevoDocumentoPage — Wizard de 4 pasos para emitir un nuevo documento.
// Ruta: /invoices/new
// =============================================================================
//
// ARQUITECTURA DE LA UI (4 pasos lineales):
//
//  ┌─── Paso 1: Inicio (Configuración Inicial) ──────────────────────────────┐
//  │  [1] Tipo de Documento                                                  │
//  │      Tipo de Comprobante *       Jurisdicción *                         │
//  │  [2] Fechas del Documento                                               │
//  │      Fecha de Expedición *       Fecha de Vencimiento *                 │
//  │  [3] Datos de Venta                                                     │
//  │      Moneda | Forma de Pago | Medio de Pago | Vendedor | Fecha de Pago  │
//  │  [4] Numeración                                                         │
//  │      Toggle "Autogenerar" (ON por defecto)                              │
//  │  [Solo Nota CR/DB] Sección de Referencia opcional:                      │
//  │      Con referencia: Número Factura + CUFE                              │
//  │      Sin referencia: Selección de Periodo                               │
//  ├─── Paso 2: Cliente ─────────────────────────────────────────────────────┤
//  │  Buscador (NIT / nombre / email) → selección obligatoria                │
//  ├─── Paso 3: Productos/Servicios ─────────────────────────────────────────┤
//  │  Buscador (nombre / código) → mínimo 1 selección obligatoria            │
//  │  Panel editable por producto: cantidad, precio, impuesto, observaciones │
//  ├─── Paso 4: Resumen ─────────────────────────────────────────────────────┤
//  │  Vista previa completa → botón "Generar Documento" → redirect /invoices  │
//  └─────────────────────────────────────────────────────────────────────────┘
//
// NOTAS DE IMPLEMENTACIÓN:
//  - Tipo de Comprobante y Jurisdicción: combobox custom (click + option).
//  - Forma de Pago y Medio de Pago: pueden ser <select> nativo o combobox.
//  - Toggle Autogenerar: <button role="switch"> o <input type="checkbox">.
//  - Búsqueda de Cliente y Producto: combobox autocomplete (type + option).
//  - La sección de Referencia aparece SOLO cuando el tipo es Nota CR o Nota DB.
//  - La Fecha de Expedición es auto-rellenada (no editable) con la fecha actual.
//  - Después de "Generar Documento" la app redirige a /invoices.
//
// SELECTORES:
//  Los data-testid de este módulo aún no están implementados en el frontend.
//  Los métodos usan cy.contains() para navegación por etiqueta + within() para
//  scope. Cuando el FE agregue [data-testid="nd-*"], SEL.nuevoDocumento.*
//  tendrá prioridad automática.
// =============================================================================

import BasePage from './BasePage';
import SEL from '../support/selectors';
import { t } from '../support/i18n';

export default class NuevoDocumentoPage extends BasePage {
  get path() {
    return '/invoices/new';
  }

  /** El wizard siempre tiene el botón "Siguiente" visible en pasos 1-3. */
  get readySelector() {
    return SEL.app.shell;
  }

  /** Confirmar autenticación y esperar que el wizard esté cargado. */
  waitForReady() {
    this.assertAuthenticated();
    cy.contains('button', t('nd.btn.next'), { timeout: 15000 }).should('be.visible');
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS INTERNOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Interactúa con un elemento que puede ser <select> nativo o combobox custom.
   * - Si es <select>: usa cy.wrap().select(value).
   * - Si es custom [role="combobox"] o button: click + click option.
   *
   * @param {JQuery} $el - Elemento jQuery
   * @param {string} value - Valor a seleccionar
   */
  _selectValue($el, value) {
    if ($el.is('select')) {
      cy.wrap($el).select(value);
    } else {
      cy.wrap($el).click();
      // Esperar y hacer click en la opción del dropdown
      cy.contains('[role="option"]', value, { timeout: 6000 }).click();
    }
  }

  /**
   * Encuentra el contenedor de un campo por su texto de etiqueta.
   * Busca la etiqueta con cy.contains, sube al contenedor más cercano y
   * devuelve el input/select/combobox hijo.
   *
   * @param {string} labelText - Texto visible de la etiqueta del campo
   * @param {string} inputSelector - Selector del input dentro del contenedor
   * @returns Cypress chainable con el elemento encontrado
   */
  _getFieldByLabel(labelText, inputSelector = 'select, [role="combobox"], input, button') {
    return cy.contains(labelText).closest('div').find(inputSelector).first();
  }

  /**
   * Hace click en el botón "Siguiente" del wizard.
   * Espera explícitamente que el botón esté habilitado antes de hacer click.
   * Esto evita clicks en botones deshabilitados (ej: validación de cliente/producto
   * aún procesándose) que no navegan y hacen fallar al _esperarPaso siguiente.
   */
  _clickSiguiente() {
    cy.contains('button', t('nd.btn.next'), { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    return this;
  }

  /**
   * Hace click en el botón "Anterior".
   */
  _clickAnterior() {
    cy.get('body').then(($b) => {
      if ($b.find(SEL.nuevoDocumento.prevBtn).length > 0) {
        cy.get(SEL.nuevoDocumento.prevBtn).first().click();
      } else {
        cy.contains('button', t('nd.btn.prev')).click();
      }
    });
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 1: CONFIGURACIÓN INICIAL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Selecciona el Tipo de Comprobante en el Paso 1.
   *
   * DOM real: <button role="combobox" id="docType" aria-autocomplete="none">
   * Es un Radix UI Select. Al hacer click abre [role="listbox"] + [role="option"].
   *
   * @param {string} tipo - 'Factura'|'Nota Crédito'|'Nota Debito'|'DSNO'|'Nota DSNO'
   */
  seleccionarTipoDocumento(tipo) {
    cy.logStep('Paso 1 › Tipo de Comprobante', { tipo });

    // Abrir el Radix Select
    cy.get(SEL.nuevoDocumento.tipoComprobante, { timeout: 10000 })
      .first()
      .should('be.visible')
      .click();

    // Confirmar que el listbox abrió antes de buscar opciones
    cy.get('[role="listbox"]', { timeout: 8000 }).should('be.visible');

    // cy.contains() con selector filtra ENTRE todos los elementos que coinciden
    // con ese selector Y contienen ese texto — es el uso correcto para este caso.
    cy.contains('[role="option"]', tipo, { timeout: 8000 }).should('be.visible').click();

    // Verificar selección
    cy.get(SEL.nuevoDocumento.tipoComprobante).first().should('contain.text', tipo);

    return this;
  }

  /**
   * Selecciona la Jurisdicción (por defecto Colombia).
   *
   * @param {string} jurisdiccion - Ej: 'Colombia (DIAN)'
   */
  seleccionarJurisdiccion(jurisdiccion) {
    cy.logStep('Paso 1 › Jurisdicción', { jurisdiccion });

    cy.get('body').then(($b) => {
      if ($b.find(SEL.nuevoDocumento.jurisdiccion).length > 0) {
        cy.get(SEL.nuevoDocumento.jurisdiccion)
          .first()
          .then(($el) => this._selectValue($el, jurisdiccion));
        return;
      }

      this._getFieldByLabel(
        t('nd.field.jurisdiccion'),
        'select, [role="combobox"], button[aria-haspopup="listbox"]',
      ).then(($el) => this._selectValue($el, jurisdiccion));
    });

    return this;
  }

  /**
   * Configura la sección de referencia (solo visible para Nota Crédito y Nota Debito).
   *
   * @param {object} opts
   *   - conReferencia {boolean} - true: ingresar factura + CUFE. false: solo periodo.
   *   - facturaNumero {string}  - Número de factura de referencia (ej: 'SETT-473337')
   *   - cufe          {string}  - CUFE de la factura de referencia
   *   - periodo       {string}  - Periodo (cuando conReferencia = false)
   */
  configurarReferencia({
    conReferencia = false,
    facturaNumero = '',
    cufe = '',
    periodo = '',
  } = {}) {
    if (conReferencia) {
      cy.logStep('Paso 1 › Referencia: con factura + CUFE', { facturaNumero });

      // Ingresar número de factura de referencia
      cy.get('body').then(($b) => {
        if ($b.find(SEL.nuevoDocumento.refFacturaInput).length > 0) {
          cy.get(SEL.nuevoDocumento.refFacturaInput).first().clear().type(facturaNumero);
        } else {
          // Fallback: buscar input de referencia por placeholder o nombre
          cy.get('input[placeholder*="factura" i], input[placeholder*="referencia" i]')
            .first()
            .clear()
            .type(facturaNumero);
        }
      });

      // Ingresar CUFE
      cy.get('body').then(($b) => {
        if ($b.find(SEL.nuevoDocumento.refCufeInput).length > 0) {
          cy.get(SEL.nuevoDocumento.refCufeInput).first().clear().type(cufe);
        } else {
          // Fallback: buscar input de CUFE
          cy.get('input[placeholder*="CUFE" i], input[placeholder*="cufe" i]')
            .first()
            .clear()
            .type(cufe);
        }
      });
    } else {
      cy.logStep('Paso 1 › Referencia: sin referencia (solo periodo)', { periodo });

      // Seleccionar periodo cuando no hay referencia
      if (periodo) {
        cy.get('body').then(($b) => {
          if ($b.find(SEL.nuevoDocumento.refPeriodo).length > 0) {
            cy.get(SEL.nuevoDocumento.refPeriodo)
              .first()
              .then(($el) => this._selectValue($el, periodo));
          } else {
            // La sección de periodo puede ser un select o range de fechas
            cy.contains(t('nd.field.periodo'))
              .closest('div')
              .find('select, input')
              .first()
              .then(($el) => {
                if ($el.is('select')) {
                  cy.wrap($el).select(periodo);
                } else {
                  cy.wrap($el).clear().type(periodo);
                }
              });
          }
        });
      }
    }

    return this;
  }

  /**
   * Deshabilita la numeración automática y verifica que aparezcan los campos
   * de resolución y número manual.
   */
  deshabilitarAutonumeracion() {
    cy.logStep('Paso 1 › Numeración: deshabilitar Autogenerar');

    cy.get('body').then(($b) => {
      if ($b.find(SEL.nuevoDocumento.numeracionToggle).length > 0) {
        cy.get(SEL.nuevoDocumento.numeracionToggle).first().click();
      } else {
        // Fallback: buscar el toggle por su aria-label o por el texto "Autogenerar"
        cy.contains('Autogenerar')
          .closest('div')
          .find('button[role="switch"], input[type="checkbox"]')
          .first()
          .click();
      }
    });

    // Verificar que aparecen los campos de resolución
    cy.get(SEL.nuevoDocumento.resolucionSelect, { timeout: 6000 })
      .should('exist')
      .and('be.visible');

    return this;
  }

  /**
   * Completa el Paso 1 con los valores por defecto (Factura, Colombia, valores predeterminados).
   * Solo cambia el tipo si se provee. Los demás campos se dejan con sus valores por defecto.
   *
   * @param {object} opts
   *   - tipo {string}             - Tipo de comprobante a seleccionar
   *   - conReferencia {boolean}   - Para Nota CR/DB: usar referencia o no
   *   - facturaRef {string}       - Número de factura de referencia
   *   - cufe {string}             - CUFE de referencia
   *   - periodo {string}          - Periodo (sin referencia)
   */
  completarPaso1({
    tipo = 'Factura',
    conReferencia = false,
    facturaRef = '',
    cufe = '',
    periodo = '',
  } = {}) {
    cy.logStep('Completando Paso 1 (Inicio)', { tipo, conReferencia });

    // Cambiar tipo solo si es diferente al default
    if (tipo !== 'Factura') {
      this.seleccionarTipoDocumento(tipo);

      // Si el tipo tiene referencia opcional, configurarla
      const tiposConReferencia = ['Nota Credito', 'Nota Debito'];
      if (tiposConReferencia.includes(tipo)) {
        // Esperar que aparezca la sección de referencia
        cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting
        this.configurarReferencia({
          conReferencia,
          facturaNumero: facturaRef,
          cufe,
          periodo,
        });
      }
    }

    // La Fecha de Vencimiento, Moneda, Forma/Medio de Pago ya tienen valores
    // por defecto adecuados. Solo avanzamos al siguiente paso.
    this._clickSiguiente();
    this._esperarPaso(2);

    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 2: CLIENTE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Busca y selecciona un cliente en el Paso 2.
   *
   * DOM real: <button role="combobox" aria-haspopup="dialog"> con texto "Seleccione un cliente"
   * Al hacer click abre un [role="dialog"] con un <input> de búsqueda dentro.
   *
   * @param {string} busqueda - NIT, nombre o email del cliente
   * @param {string} textoOpcion - Texto visible de la opción a seleccionar (nombre del cliente)
   */
  buscarYSeleccionarCliente(busqueda, textoOpcion) {
    cy.logStep('Paso 2 › Abrir dialog de cliente', { busqueda });

    // 1. Abrir el dialog haciendo click en el trigger.
    // Se usa cy.contains() en lugar de cy.get() para ser resiliente a re-renders de
    // React/MobX: cy.contains() re-consulta el texto en cada retry, evitando
    // referencias obsoletas al elemento (error "page updated while clicking").
    // Texto del placeholder confirmado en el HTML real: "Seleccione un cliente"
    cy.contains('button[role="combobox"][aria-haspopup="dialog"]', 'Seleccione un cliente', {
      timeout: 10000,
    })
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    // 2. Esperar que el dialog abra
    cy.get('[role="dialog"]', { timeout: 8000 }).should('be.visible');

    // 3. Escribir la búsqueda en el input dentro del dialog.
    // Se encadena directamente sobre el dialog para evitar ambigüedad de scope.
    cy.get('[role="dialog"] input', { timeout: 6000 })
      .first()
      .should('be.visible')
      .type(busqueda, { delay: 50 });

    // 4. Seleccionar el resultado que coincide con el texto esperado.
    // Patrón: cy.get(dialog).contains(texto) — encadena el scope sin usar .within(),
    // lo que evita la limitación de Cypress donde .closest() puede fallar dentro de
    // un bloque .within() al intentar subir por el árbol DOM.
    // .closest() sube del <p> o <span> hijo al <div cmdk-item role="option"> padre,
    // que es el elemento real con el handler onSelect del combobox.
    const opcionTexto = textoOpcion || busqueda;
    cy.get('[role="dialog"]')
      .contains(opcionTexto, { timeout: 10000 })
      .closest('[cmdk-item], [role="option"]')
      .click();

    // 5. Esperar que el dialog se cierre.
    // Radix UI pone data-state="closed" antes de desmontar → esperamos que el
    // atributo data-state="open" desaparezca (elemento removido o cambia a "closed").
    cy.get('[role="dialog"][data-state="open"]', { timeout: 8000 }).should('not.exist');

    // 6. Screenshot de diagnóstico: captura el estado real tras cierre del dialog.
    // Ayuda a depurar si el wizard no actualizó su estado correctamente.
    cy.screenshot('paso2-tras-cierre-dialog-cliente', { overwrite: true });

    // 7. Verificar que el TRIGGER del combobox ahora muestra el cliente seleccionado.
    // IMPORTANTE: esto confirma que el WIZARD actualizó su estado interno, no solo
    // que el texto aparece en algún lugar de la página (ej: en el dialog aún animándose
    // hacia el cierre o en el panel de preview lateral).
    // Si este check pasa → el wizard tiene el cliente en su estado → Siguiente avanzará.
    cy.contains('button[role="combobox"][aria-haspopup="dialog"]', opcionTexto, {
      timeout: 10000,
    }).should('be.visible');

    cy.logStep('Paso 2 › Cliente seleccionado y confirmado en estado del wizard', { opcionTexto });

    return this;
  }

  /**
   * Completa el Paso 2: busca cliente por NIT y avanza al Paso 3.
   *
   * @param {object} cliente - { nit, nombre, email }
   */
  completarPaso2(cliente) {
    cy.logStep('Completando Paso 2 (Cliente)', { nit: cliente.nit });

    this.buscarYSeleccionarCliente(cliente.nit, cliente.nombre);

    this._clickSiguiente();
    this._esperarPaso(3);

    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 3: PRODUCTOS / SERVICIOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Busca y agrega un producto/servicio al documento.
   *
   * DOM real: <button role="combobox" aria-haspopup="dialog"> con texto "Buscar y agregar producto..."
   * Al hacer click abre un [role="dialog"] con un <input> de búsqueda dentro.
   * Mismo patrón que buscarYSeleccionarCliente.
   *
   * @param {string} busqueda - Nombre o código del producto
   * @param {string} textoOpcion - Texto visible de la opción a seleccionar (nombre del producto)
   */
  buscarYAgregarProducto(busqueda, textoOpcion) {
    cy.logStep('Paso 3 › Abrir dialog de producto', { busqueda });

    // 1. Abrir el dialog haciendo click en el trigger.
    // cy.contains() es clave aquí: el texto "Buscar y agregar producto..." distingue
    // este trigger del trigger de cliente (mismo selector CSS pero diferente placeholder).
    // También es resiliente a re-renders de MobX que remontan el componente:
    // cada retry de cy.contains() re-consulta el DOM completo incluyendo el texto.
    // Texto del placeholder confirmado en el HTML real del Paso 3.
    cy.contains('button[role="combobox"][aria-haspopup="dialog"]', 'Buscar y agregar producto', {
      timeout: 10000,
    })
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    // 2. Esperar que el dialog abra
    cy.get('[role="dialog"]', { timeout: 8000 }).should('be.visible');

    // 3. Escribir la búsqueda en el input dentro del dialog.
    cy.get('[role="dialog"] input', { timeout: 6000 })
      .first()
      .should('be.visible')
      .type(busqueda, { delay: 50 });

    // 4. Seleccionar el resultado que coincide con el texto esperado.
    // Mismo patrón que buscarYSeleccionarCliente: chain directo sobre el dialog
    // + .closest() para subir al elemento padre interactivo (cmdk-item / role=option).
    const opcionTexto = textoOpcion || busqueda;
    cy.get('[role="dialog"]')
      .contains(opcionTexto, { timeout: 10000 })
      .closest('[cmdk-item], [role="option"]')
      .click();

    // 5. Esperar que el dialog se cierre.
    cy.get('[role="dialog"][data-state="open"]', { timeout: 8000 }).should('not.exist');

    // 6. El producto aparece en el panel de productos agregados (confirma que se añadió)
    cy.contains(opcionTexto, { timeout: 8000 }).should('be.visible');
    cy.logStep('Paso 3 › Producto agregado', { opcionTexto });

    return this;
  }

  /**
   * Completa el Paso 3: agrega el producto y avanza al Paso 4.
   *
   * @param {object} producto - { nombre, codigo }
   */
  completarPaso3(producto) {
    cy.logStep('Completando Paso 3 (Productos)', { producto: producto.nombre });

    // Buscar primero por código, fallback por nombre
    this.buscarYAgregarProducto(producto.codigo, producto.nombre);

    this._clickSiguiente();
    this._esperarPaso(4);

    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 4: RESUMEN Y GENERACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Hace click en "Generar Documento" e intercept la petición de creación.
   * Espera a que la app redirija a /invoices tras el éxito.
   */
  generarDocumento() {
    cy.logStep('Paso 4 › Generar Documento');

    // Interceptar la petición de creación del documento (cualquier método POST al endpoint)
    cy.intercept('POST', /document|invoice|factura/i).as('NuevoDocPage:crearDocumento');

    cy.get('body').then(($b) => {
      if ($b.find(SEL.nuevoDocumento.generateBtn).length > 0) {
        cy.get(SEL.nuevoDocumento.generateBtn).first().click();
      } else {
        cy.contains('button', t('nd.btn.generate')).click();
      }
    });

    // Esperar respuesta exitosa del servidor
    cy.wait('@NuevoDocPage:crearDocumento', { timeout: 20000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 201]);

    // Verificar redirección a /invoices
    cy.url({ timeout: 15000 }).should('include', '/invoices');
    cy.url().should('not.include', '/new');

    cy.logStep('Paso 4 › Documento generado correctamente');
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS DE FLUJO Y ESPERA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Espera a que el wizard muestre el paso indicado (1-4).
   * Detecta por el indicador de paso activo en el breadcrumb superior.
   *
   * @param {number} paso - Número del paso esperado (1-4)
   */
  _esperarPaso(paso) {
    // Estrategia: anclar cada paso a su TEXTO FUNCIONAL ÚNICO, no a data-testid ni
    // al título del heading. Esto es resiliente a:
    //   - Re-renders de MobX que remontan el árbol React
    //   - Cambios de wording en headings
    //   - Animaciones de entrada (opacity 0→1)
    //
    // cy.contains() reintenta incluyendo la verificación de texto en cada ciclo,
    // lo que lo hace mucho más estable ante re-renders que cy.get() con selectores CSS.

    if (paso === 2) {
      // Paso 2 → placeholder único del trigger de cliente
      // DOM: <button role="combobox" aria-haspopup="dialog"><span>Seleccione un cliente</span>
      cy.contains('button[role="combobox"]', 'Seleccione un cliente', { timeout: 12000 }).should(
        'be.visible',
      );
    } else if (paso === 3) {
      // Paso 3 → placeholder único del trigger de producto (distinto del de cliente)
      // DOM: <button role="combobox" aria-haspopup="dialog"><span>Buscar y agregar producto...</span>
      cy.contains('button[role="combobox"]', 'Buscar y agregar producto', {
        timeout: 12000,
      }).should('be.visible');
    } else if (paso === 4) {
      // Paso 4 → botón "Generar Documento" (único en el flujo)
      cy.contains('button', t('nd.btn.generate'), { timeout: 12000 }).should('be.visible');
    }

    return this;
  }

  /**
   * Flujo completo de 4 pasos para crear un documento.
   * Centraliza la lógica compartida entre todos los tipos de documento.
   *
   * @param {object} opts
   *   - tipo          {string}  - Tipo de comprobante
   *   - cliente       {object}  - { nombre, nit, email }
   *   - producto      {object}  - { nombre, codigo }
   *   - conReferencia {boolean} - Para CR/DB: usar referencia o no
   *   - facturaRef    {string}  - Número de factura de referencia
   *   - cufe          {string}  - CUFE de referencia
   *   - periodo       {string}  - Periodo (sin referencia)
   */
  completarFlujoCompleto({ tipo, cliente, producto, conReferencia, facturaRef, cufe, periodo }) {
    cy.logStep(`▶ Iniciando flujo completo: ${tipo}`);

    this.completarPaso1({ tipo, conReferencia, facturaRef, cufe, periodo });
    this.completarPaso2(cliente);
    this.completarPaso3(producto);
    this.generarDocumento();

    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASERCIONES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica que el Paso 2 no permite avanzar sin seleccionar un cliente.
   * El botón "Siguiente" debe estar deshabilitado o mostrar un error.
   */
  shouldBloquearSinCliente() {
    cy.logStep('Verificar: Paso 2 bloqueado sin cliente');

    cy.get('body').then(($b) => {
      // Opción A: el botón está deshabilitado
      if ($b.find(SEL.nuevoDocumento.nextBtn).length > 0) {
        cy.get(SEL.nuevoDocumento.nextBtn).first().should('be.disabled');
        return;
      }

      // Opción B: verificar que click en Siguiente muestra error / no avanza al Paso 3
      cy.contains('button', t('nd.btn.next')).then(($btn) => {
        if ($btn.is(':disabled')) {
          // OK — el botón ya está deshabilitado
          cy.wrap($btn).should('be.disabled');
        } else {
          // Hacer click y verificar que no avanzó (el título del Paso 3 NO aparece)
          cy.wrap($btn).click();
          cy.contains(t('nd.step3.title'), { timeout: 3000 }).should('not.exist');
          // Y/O aparece mensaje de error
          cy.get('body').should('satisfy', ($b2) => {
            const text = $b2.text().toLowerCase();
            return (
              text.includes('cliente') ||
              text.includes('requerido') ||
              text.includes('obligatorio') ||
              text.includes('seleccione')
            );
          });
        }
      });
    });

    return this;
  }

  /**
   * Verifica que el Paso 3 no permite avanzar sin agregar al menos un producto.
   */
  shouldBloquearSinProducto() {
    cy.logStep('Verificar: Paso 3 bloqueado sin producto');

    cy.get('body').then(($b) => {
      if ($b.find(SEL.nuevoDocumento.nextBtn).length > 0) {
        cy.get(SEL.nuevoDocumento.nextBtn).first().should('be.disabled');
        return;
      }

      cy.contains('button', t('nd.btn.next')).then(($btn) => {
        if ($btn.is(':disabled')) {
          cy.wrap($btn).should('be.disabled');
        } else {
          cy.wrap($btn).click();
          cy.contains(t('nd.step4.title'), { timeout: 3000 }).should('not.exist');
          cy.get('body').should('satisfy', ($b2) => {
            const text = $b2.text().toLowerCase();
            return (
              text.includes('producto') ||
              text.includes('requerido') ||
              text.includes('obligatorio') ||
              text.includes('agreg')
            );
          });
        }
      });
    });

    return this;
  }

  /**
   * Verifica que el Paso 4 muestra la información del documento antes de generar.
   *
   * @param {object} opts
   *   - tipo    {string}  - Tipo de comprobante esperado
   *   - cliente {string}  - Nombre del cliente esperado
   *   - producto {string} - Nombre del producto esperado (opcional)
   */
  shouldMostrarResumen({ tipo, cliente, producto } = {}) {
    cy.logStep('Paso 4 › Verificar resumen del documento');

    // El resumen siempre muestra el tipo de documento
    if (tipo) {
      cy.contains(tipo, { timeout: 8000 }).should('be.visible');
    }

    // El resumen debe mostrar el nombre del cliente
    if (cliente) {
      cy.contains(cliente, { timeout: 8000 }).should('be.visible');
    }

    // El resumen debe mostrar el producto agregado
    if (producto) {
      cy.contains(producto, { timeout: 8000 }).should('be.visible');
    }

    // El botón "Generar Documento" debe estar presente y habilitado
    cy.get('body').then(($b) => {
      if ($b.find(SEL.nuevoDocumento.generateBtn).length > 0) {
        cy.get(SEL.nuevoDocumento.generateBtn).first().should('be.visible').and('be.enabled');
      } else {
        cy.contains('button', t('nd.btn.generate')).should('be.visible').and('be.enabled');
      }
    });

    return this;
  }

  /**
   * Verifica que la página de resumen muestra los campos informativos clave.
   */
  shouldMostrarCamposResumen() {
    cy.logStep('Paso 4 › Verificar campos del resumen');

    // El resumen siempre debe mostrar: Tipo, Fechas, Cliente, Productos
    const textosEsperados = [
      t('nd.resumen.tipoComprobante'),
      t('nd.resumen.fechaExpedicion'),
      t('nd.resumen.cliente'),
    ];

    textosEsperados.forEach((texto) => {
      cy.contains(texto, { timeout: 8000 }).should('be.visible');
    });

    return this;
  }
}
