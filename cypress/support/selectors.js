// =============================================================================
// Selectores centralizados — eBill Pro Go
// -----------------------------------------------------------------------------
// Estrategia: PRIMARIO = data-testid (pedirlo al equipo de frontend).
// FALLBACK = atributos HTML estables (name, type, role, autocomplete).
// PROHIBIDO: texto literal, clases CSS parciales ([class*=...]), :first-child
// o selectores basados en posición.
//
// Convención de data-testid:
//   <modulo>-<componente>-<accion|campo>
//   ej: "login-form-username", "doc-search-submit", "client-row-edit"
// =============================================================================

/** Helper: construir selector con primario + fallback ordenados. */
const combine = (...sels) => sels.filter(Boolean).join(', ');

export const SEL = {
  // ─── App shell ────────────────────────────────────────────────────────────
  app: {
    shell: '[data-testid="app-shell"], body',
    header: '[data-testid="app-header"], header',
    sidebar: '[data-testid="app-sidebar"], nav[aria-label*="principal"]',
    userMenu: '[data-testid="user-menu-trigger"], button[aria-haspopup="menu"]',
    logoutBtn: '[data-testid="user-menu-logout"]',
  },

  // ─── Autenticación ────────────────────────────────────────────────────────
  // NOTA: El front actual NO tiene data-testid ni name ni autocomplete en el
  //       input de username, por eso se incluye una cascada de fallbacks CSS.
  //       Cuando el FE agregue [data-testid="login-username"] los fallbacks
  //       quedan sin efecto (el primario siempre gana en el orden CSS).
  //       En el Page Object se aplica `.first()` para tolerar matches múltiples.
  login: {
    form: '[data-testid="login-form"], form',
    username: combine(
      '[data-testid="login-username"]',
      'input[name="username"]',
      'input[name="user"]',
      'input[name="email"]',
      'input[autocomplete="username"]',
      'input[autocomplete="email"]',
      'input[type="email"]',
      'input[type="text"]',
      // último recurso: cualquier input que NO sea password/checkbox/radio/hidden/submit/button
      'input:not([type="password"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="submit"]):not([type="button"])',
    ),
    password: combine(
      '[data-testid="login-password"]',
      'input[type="password"]',
      'input[autocomplete="current-password"]',
    ),
    submit: combine(
      '[data-testid="login-submit"]',
      'button[type="submit"]',
      'form button:not([type="button"]):not([type="reset"])',
    ),
    error: combine(
      '[data-testid="login-error"]',
      // Radix UI Toast (shadcn/ui): el toast es un <li role="status" data-state="open">
      // dentro de un <div role="region" aria-label="Notifications...">
      'li[role="status"][data-state="open"]',
      'li[role="status"]',
      '[role="region"] li',
      '[role="alert"]',
      '.p-message-error',
      '.error-message',
    ),
    togglePw: '[data-testid="login-password-toggle"], button[aria-label*="contrase"]',
  },

  // ─── Navegación (sidebar) ─────────────────────────────────────────────────
  nav: {
    dashboard: '[data-testid="nav-dashboard"]',
    documents: '[data-testid="nav-documents"]',
    clients: '[data-testid="nav-clients"]',
    products: '[data-testid="nav-products"]',
    company: '[data-testid="nav-company"]',
  },

  // ─── Módulo Dashboard ─────────────────────────────────────────────────────
  dashboard: {
    monthSelector: '[data-testid="dashboard-month-selector"]',
    metricCard: (id) => `[data-testid="dashboard-metric-${id}"]`,
    newDocBtn: '[data-testid="dashboard-new-document"]',
  },

  // ─── Módulo Documentos ────────────────────────────────────────────────────
  // NOTA: La app usa filtros reactivos (no hay botón submit para buscar).
  // El panel de filtros avanzados se abre con el botón "Filtros".
  // Estructura de la página:
  //   1. Input "Buscar por cliente..." → siempre visible
  //   2. Botón "Filtros" → abre panel con: NÚMERO DE DOCUMENTO, TIPO, FECHA
  //   3. Tabla/lista de resultados (sin data-testid en el FE actual)
  documents: {
    // Panel principal (siempre visible) — sin data-testid en el FE actual,
    // se usa body como mínimo denominador común.
    searchPanel: combine('[data-testid="doc-search-panel"]', 'main, [role="main"], body'),

    // Búsqueda por nombre de cliente (input siempre visible en la página).
    // NOTA: Sizzle (jQuery/Cypress) NO soporta el flag " i" en selectores de atributo.
    // Se usa el placeholder exacto en minúsculas según el HTML real.
    clientFilter: combine(
      '[data-testid="doc-filter-client"]',
      'input[placeholder="Buscar por cliente..."]',
      'input[placeholder*="cliente"]',
    ),

    // Botón que abre/cierra el panel de filtros avanzados.
    // El fallback vía texto "Filtros" se gestiona en el Page Object con cy.contains()
    // ya que Sizzle no soporta :contains() como pseudo-clase CSS.
    filtersBtn: '[data-testid="doc-filters-toggle"]',

    // Panel de filtros avanzados (solo visible tras abrir con el botón Filtros).
    filtersPanel: '[data-testid="doc-filters-panel"]',

    // Input NÚMERO DE DOCUMENTO dentro del panel de filtros avanzados.
    // Placeholder exacto visible en la app: "INV-2025-001" (con mayúsculas).
    // IMPORTANTE: sin flag " i" — Sizzle no lo soporta y lanza SyntaxError.
    docNumberInput: combine(
      '[data-testid="doc-search-number"]',
      'input[name="numeroDocumento"]',
      'input[placeholder="INV-2025-001"]',
      'input[placeholder*="INV-"]',
    ),

    // Selector de TIPO DE DOCUMENTO dentro del panel de filtros.
    tipoSelect: combine(
      '[data-testid="doc-search-type"]',
      'select[name="tipo"]',
      '[role="combobox"]',
    ),

    resultCount: '[data-testid="doc-result-count"]',

    // El estado vacío puede ser un mensaje de texto — se valida en el Page Object
    // con cy.contains() para mayor resiliencia.
    resultEmpty: '[data-testid="doc-result-empty"]',

    // IMPORTANTE: La lista de resultados usa <div> con Tailwind, NO <table><tr>.
    // Los div-fila tienen las clases "cursor-pointer" y "animate-fade-in" que los
    // distinguen del resto del DOM (el header no tiene animate-fade-in).
    resultRow: combine(
      '[data-testid^="doc-row-"]',
      'div[class*="cursor-pointer"][class*="animate-fade-in"]',
    ),

    // El encabezado de columnas es un <div> con clase "tracking-widest".
    // Los nombres de columna son <span> dentro de ese div.
    resultTable: combine('[data-testid="doc-result-table"]', 'div[class*="tracking-widest"]'),
    colHeader: (col) => `[data-testid="doc-col-${col}"]`,

    // Panel lateral / modal de detalle del documento (se monta dinámicamente).
    // Fallback: verificar por texto visible en body (Ver PDF, Información del Documento).
    drawer: combine('[data-testid="doc-detail-drawer"]', '[role="dialog"]'),
    drawerTitle: combine(
      '[data-testid="doc-detail-title"]',
      '[role="dialog"] h2',
      '[role="dialog"] h3',
    ),
    drawerPdfBtn: '[data-testid="doc-detail-pdf"]',
    drawerClose: combine(
      '[data-testid="doc-detail-close"]',
      '[role="dialog"] button[aria-label*="close"]',
      '[role="dialog"] button[aria-label*="cerrar"]',
    ),
  },

  clients: {
    listTable: combine(
      '[data-testid="clients-table"]',
      'div[class*="card"]',
      'div[class*="rounded"]',
    ),

    searchInput: combine(
      '[data-testid="clients-search"]',
      'input[placeholder*="identificaci"]',
      'input[placeholder*="buscar"]',
      'input[placeholder*="cliente"]',
      'input[placeholder*="email"]',
    ),

    newBtn: combine('[data-testid="clients-new"]', 'button:contains("Nuevo Cliente")'),

    // 🔥 ESTE ES EL CAMBIO CLAVE
    row: combine(
      '[data-testid^="client-row-"]', // futuro
      'div.group.cursor-pointer', // REAL
      'div[class*="cursor-pointer"][class*="grid"]',
    ),

    // fallback inteligente (no depende de data-testid)
    rowByNit: (nit) => `div.group:contains("${nit}")`,

    totalCount: combine('[data-testid="clients-total-count"]', 'p:contains("clientes")'),

    emptyState: combine(
      '[data-testid="clients-empty"]',
      'p:contains("clientes")',
      'div:contains("sin")',
      'div:contains("No hay")',
    ),

    detailModal: combine('[data-testid="client-detail-modal"]', '[role="dialog"]'),

    detailTitle: combine('[data-testid="client-detail-title"]', 'h1, h2'),

    detailClose: combine(
      '[data-testid="client-detail-close"]',
      'button[aria-label*="close"]',
      'button[aria-label*="cerrar"]',
    ),

    form: {
      root: '[data-testid="client-form"]',
      nit: '[data-testid="client-form-nit"]',
      name: '[data-testid="client-form-name"]',
      email: '[data-testid="client-form-email"]',
      submit: '[data-testid="client-form-submit"]',
    },
  },

  // ─── Módulo Productos ─────────────────────────────────────────────────────
  products: {
    listTable: '[data-testid="products-table"]',
    searchInput: '[data-testid="products-search"]',
    newBtn: '[data-testid="products-new"]',
    row: '[data-testid^="product-row-"]',
    form: {
      root: '[data-testid="product-form"]',
      code: '[data-testid="product-form-code"]',
      name: '[data-testid="product-form-name"]',
      price: '[data-testid="product-form-price"]',
      tax: '[data-testid="product-form-tax"]',
      submit: '[data-testid="product-form-submit"]',
    },
  },

  // ─── Nuevo Documento — Wizard 4 pasos (/invoices/new) ───────────────────
  //
  // ESTRATEGIA DE SELECCIÓN:
  //   La UI actual no expone data-testid en este formulario, por lo que los
  //   fallbacks se basan en atributos HTML estables (placeholder, type, role).
  //   El Page Object NuevoDocumentoPage.js usa cy.contains() para navegar por
  //   etiqueta cuando los selectores no son suficientemente específicos.
  //   Cuando el frontend agregue [data-testid="nd-*"], el primario tendrá
  //   prioridad automática por orden CSS.
  //
  nuevoDocumento: {
    // ── Navegación del wizard ─────────────────────────────────────────────
    // Los botones se manejan con cy.contains() en el Page Object.
    // Se dejan aquí como referencia para cuando se agreguen data-testid.
    nextBtn: '[data-testid="nd-btn-next"]',
    prevBtn: '[data-testid="nd-btn-prev"]',
    generateBtn: '[data-testid="nd-btn-generate"]',

    // Indicadores de paso (breadcrumb superior: Inicio › Cliente › Productos › Resumen)
    stepIndicator: (n) => `[data-testid="nd-step-${n}"]`,

    // ── Paso 1 › Tipo de Documento ────────────────────────────────────────
    // DOM real: <button role="combobox" id="docType" aria-autocomplete="none">
    // Es un Radix UI Select. Al hacer click abre [role="listbox"] con [role="option"].
    // Se diferencia del botón de cliente/producto porque tiene aria-autocomplete="none"
    // y el ID estable "docType".
    tipoComprobante: combine(
      '[data-testid="nd-tipo-comprobante"]',
      '#docType',
      'button[role="combobox"][aria-autocomplete="none"]',
    ),

    // Combobox "Jurisdicción" — mismo patrón Radix Select
    jurisdiccion: combine(
      '[data-testid="nd-jurisdiccion"]',
      'button[role="combobox"][aria-autocomplete="none"]:not(#docType)',
      'select[name="jurisdiccion"]',
    ),

    // Input de búsqueda dentro del dialog (cliente o producto)
    // Se usa dentro de cy.get('[role="dialog"]').within(...)
    dialogSearchInput: combine(
      '[data-testid="nd-dialog-search"]',
      'input[type="search"]',
      'input[type="text"]',
      'input',
    ),

    // ── Paso 1 › Fechas del Documento ────────────────────────────────────
    // Fecha de Expedición suele ser read-only (auto-filled con hoy).
    fechaExpedicion: combine(
      '[data-testid="nd-fecha-expedicion"]',
      'input[name="fechaExpedicion"]',
      'input[name="fecha_expedicion"]',
    ),

    // Fecha de Vencimiento — editable, tipo date.
    fechaVencimiento: combine(
      '[data-testid="nd-fecha-vencimiento"]',
      'input[name="fechaVencimiento"]',
      'input[name="fecha_vencimiento"]',
      'input[type="date"][name*="vencimiento"]',
    ),

    // ── Paso 1 › Datos de Venta ───────────────────────────────────────────
    moneda: combine(
      '[data-testid="nd-moneda"]',
      'select[name="moneda"]',
      'select[name="currency"]',
    ),

    formaPago: combine(
      '[data-testid="nd-forma-pago"]',
      'select[name="formaPago"]',
      'select[name="forma_pago"]',
      'select[name="paymentForm"]',
    ),

    medioPago: combine(
      '[data-testid="nd-medio-pago"]',
      'select[name="medioPago"]',
      'select[name="medio_pago"]',
      'select[name="paymentMethod"]',
    ),

    vendedor: combine(
      '[data-testid="nd-vendedor"]',
      'input[name="vendedor"]',
      'input[placeholder="Opcional"]',
      'input[name="seller"]',
    ),

    fechaPago: combine(
      '[data-testid="nd-fecha-pago"]',
      'input[name="fechaPago"]',
      'input[name="fecha_pago"]',
      'input[name="paymentDate"]',
    ),

    // ── Paso 1 › Numeración ───────────────────────────────────────────────
    // Toggle "Autogenerar" — puede ser <button role="switch"> o <input type="checkbox">
    numeracionToggle: combine(
      '[data-testid="nd-numeracion-auto"]',
      'button[role="switch"]',
      'input[type="checkbox"][name*="auto"]',
      'input[type="checkbox"][name*="numeracion"]',
    ),

    // Selector de resolución (visible cuando Autogenerar está OFF)
    resolucionSelect: combine(
      '[data-testid="nd-resolucion"]',
      'select[name="resolucion"]',
      'select[name="resolution"]',
      'button[role="combobox"][data-placeholder=""]',
    ),

    // Campo de número manual (visible cuando Autogenerar está OFF)
    numeroManual: combine(
      '[data-testid="nd-numero-manual"]',
      'input[name="numero"]',
      'input[name="number"]',
    ),

    // ── Paso 1 › Referencia (solo Nota Crédito / Nota Débito) ─────────────
    // Input para el número de la factura original
    refFacturaInput: combine(
      '[data-testid="nd-ref-factura"]',
      'input[name="facturaReferencia"]',
      'input[name="refFactura"]',
      'input[name="invoiceReference"]',
    ),

    // Input para el CUFE de la factura original
    refCufeInput: combine(
      '[data-testid="nd-ref-cufe"]',
      'input[name="cufe"]',
      'input[name="CUFE"]',
      'input[name="cufeRef"]',
    ),

    // Selector o input de periodo (alternativa sin referencia)
    refPeriodo: combine(
      '[data-testid="nd-ref-periodo"]',
      'select[name="periodo"]',
      'input[name="periodo"]',
      'select[name="period"]',
    ),

    // ── Paso 2 › Cliente ──────────────────────────────────────────────────
    // DOM real: <button role="combobox" aria-haspopup="dialog">
    //   <span class="text-muted-foreground">Seleccione un cliente</span>
    // Al hacer click abre un [role="dialog"] con un <input> de búsqueda dentro.
    //
    // ⚠️  IMPORTANTE: el selector CSS aquí es IDÉNTICO al de productoTrigger.
    // Para distinguirlos, el Page Object usa cy.contains('Seleccione un cliente')
    // en lugar de cy.get(SEL.nuevoDocumento.clienteTrigger). Esto también evita
    // el error "page updated while clicking" causado por re-renders de MobX.
    clienteTrigger: combine(
      '[data-testid="nd-cliente-trigger"]',
      'button[role="combobox"][aria-haspopup="dialog"]',
    ),

    // ── Paso 3 › Productos ────────────────────────────────────────────────
    // DOM real: <button role="combobox" aria-haspopup="dialog">
    //   <span class="text-muted-foreground">Buscar y agregar producto...</span>
    // Mismo patrón que clienteTrigger — abre un dialog con input de búsqueda.
    //
    // ⚠️  IMPORTANTE: usar cy.contains('Buscar y agregar producto') en lugar de
    // cy.get(SEL.nuevoDocumento.productoTrigger) para resiliencia ante re-renders.
    productoTrigger: combine(
      '[data-testid="nd-producto-trigger"]',
      'button[role="combobox"][aria-haspopup="dialog"]',
    ),
  },

  // ─── Mi Empresa ───────────────────────────────────────────────────────────
  company: {
    form: '[data-testid="company-form"]',
    logoUpload: '[data-testid="company-logo-upload"]',
    nitInput: '[data-testid="company-nit"]',
    nameInput: '[data-testid="company-name"]',
    saveBtn: '[data-testid="company-save"]',
  },
};

export default SEL;
