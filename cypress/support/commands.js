// =============================================================================
// Comandos personalizados — eBill Pro Go
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * cy.fillLogin(username, password)
 * Llena los campos del formulario de login y hace submit.
 * No espera resultado — los tests validan el resultado individualmente.
 */
Cypress.Commands.add('fillLogin', (username, password) => {
  cy.get('input').not('[type="password"]').first()
    .clear()
    .type(username, { force: true });
  cy.get('input[type="password"]').first()
    .clear()
    .type(password, { force: true });
  cy.contains('button', /Ingresar|Iniciar sesión|Login/i).click();
});

/**
 * cy.loginExitoso()
 * Realiza login completo con credenciales de cypress.config.js → env
 * y espera a que el dashboard cargue.
 *
 * IMPORTANTE: llamar siempre en beforeEach (no en before).
 * cy.session() se encarga del caché — si la sesión ya existe la restaura
 * en milisegundos sin repetir el login; si no existe la crea.
 *
 * Uso:
 *   beforeEach(() => { cy.loginExitoso(); cy.visit('/ruta'); });
 */
Cypress.Commands.add('loginExitoso', () => {
  cy.session(
    'usuario_principal',
    // ── Setup: se ejecuta solo la primera vez (o si la sesión expira)
    () => {
      cy.visit('/auth');
      cy.fillLogin(Cypress.env('USERNAME'), Cypress.env('PASSWORD'));
      cy.url({ timeout: 12000 }).should('not.include', '/auth');
    },
    {
      cacheAcrossSpecs: true,

      // ── Validate: verifica que la sesión guardada sigue siendo válida.
      // NO debe navegar — solo revisar almacenamiento o cookies.
      validate() {
        // La app guarda el token en localStorage; si existe, la sesión es válida.
        cy.window().then((win) => {
          const hasToken =
            Object.keys(win.localStorage).some((k) =>
              k.toLowerCase().includes('token') ||
              k.toLowerCase().includes('auth')  ||
              k.toLowerCase().includes('user')
            );
          // Si no hay token en localStorage, también pueden ser cookies
          if (!hasToken) {
            cy.getCookies().then((cookies) => {
              const hasAuthCookie = cookies.some((c) =>
                c.name.toLowerCase().includes('token') ||
                c.name.toLowerCase().includes('session') ||
                c.name.toLowerCase().includes('auth')
              );
              expect(hasAuthCookie, 'cookie de sesión presente').to.be.true;
            });
          }
        });
      },
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * cy.irADocumentos()
 * Navega a la lista de documentos y verifica que la sesión está activa.
 * La aserción es sobre la URL, no sobre el contenido, para evitar
 * falsos negativos por tiempos de renderizado del SPA.
 */
Cypress.Commands.add('irADocumentos', () => {
  cy.visit('/invoices');

  // Verificar que el app no redirigió al login
  cy.url({ timeout: 12000 }).should('not.include', '/auth');

  // Esperar que el body esté visible (SPA terminó de montar)
  cy.get('body').should('be.visible');
});

/**
 * cy.buscarDocumento(prefijo, numero)
 * Llena el formulario de búsqueda específica (PREFIJO + NÚMERO son obligatorios)
 * y hace click en "Buscar".
 *
 * Selectores basados en la UI real observada:
 *   - Sección: "Buscar documento específico"
 *   - Campos: PREFIJO (2do input del form) y NÚMERO (3er input del form)
 *   - Botón: "Buscar" — está disabled hasta que ambos campos tengan valor
 */
Cypress.Commands.add('buscarDocumento', (prefijo, numero) => {
  // Esperar que los inputs del formulario de búsqueda estén presentes
  // El form tiene 3 controles en orden: TIPO (select) | PREFIJO (input) | NÚMERO (input)
  cy.contains('Buscar documento específico').should('be.visible');

  // Campo PREFIJO — el label en el DOM dice "Prefijo" (CSS uppercase lo muestra en mayúsculas)
  cy.contains('Prefijo')
    .closest('div')
    .find('input')
    .clear()
    .type(prefijo, { force: true });

  // Campo NÚMERO — idem, en el DOM es "Número"
  cy.contains('Número')
    .closest('div')
    .find('input')
    .clear()
    .type(numero, { force: true });

  // El botón Buscar se habilita cuando ambos campos tienen valor
  cy.contains('button', 'Buscar').should('not.be.disabled').click();

  // Esperar a que la búsqueda resuelva (aparece el conteo de resultados)
  cy.get('body', { timeout: 10000 }).should('satisfy', ($b) =>
    $b.text().includes('documento encontrado') ||
    $b.text().includes('documentos encontrados') ||
    $b.text().toLowerCase().includes('sin resultado') ||
    $b.text().toLowerCase().includes('no se encontr')
  );
});
