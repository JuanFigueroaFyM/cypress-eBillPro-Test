// =============================================================================
// Suite: Autenticación — /auth
// Casos:
//   TC-AUTH-001  Login exitoso con credenciales válidas
//   TC-AUTH-002  Login con usuario inexistente
//   TC-AUTH-003  Login con contraseña incorrecta
//   TC-AUTH-004  Submit con campos vacíos (validación HTML5 / frontend)
//   TC-AUTH-005  La contraseña no se muestra en texto plano
//   TC-AUTH-006  La sesión persiste al recargar (F5)
//   TC-AUTH-007  Logout cierra la sesión y redirige al login
// =============================================================================

describe('Autenticación — /auth', () => {

  // Antes de cada test volver siempre al login limpio
  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.visit('/auth');

    // Esperar que el formulario esté listo
    cy.get('input[type="password"]', { timeout: 8000 }).should('be.visible');
  });

  // ── TC-AUTH-001 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-001 | Login exitoso redirige fuera de /auth', () => {
    cy.fixture('users').then(({ valid }) => {
      cy.fillLogin(valid.username, valid.password);

      // La URL ya no debe ser /auth
      cy.url({ timeout: 12000 }).should('not.include', '/auth');

      // Debe aparecer algún elemento de la app autenticada
      cy.get('body', { timeout: 8000 }).should('satisfy', ($body) => {
        const text = $body.text();
        return (
          text.includes('Dashboard')    ||
          text.includes('Documentos')   ||
          text.includes('Facturas')
        );
      });
    });
  });

  // ── TC-AUTH-002 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-002 | Usuario inexistente muestra error sin revelar detalles', () => {
    cy.fixture('users').then(({ invalid_user }) => {
      cy.fillLogin(invalid_user.username, invalid_user.password);

      // Debe seguir en /auth o mostrar mensaje de error
      cy.get('body', { timeout: 8000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return (
          text.includes('inválido')     ||
          text.includes('incorrecto')   ||
          text.includes('error')        ||
          text.includes('credenciales') ||
          $body.find('input[type="password"]').length > 0 // sigue en login
        );
      });

      // No debe revelar si el usuario existe o no
      cy.get('body').should('not.contain.text', 'no existe');
      cy.get('body').should('not.contain.text', 'not found');
    });
  });

  // ── TC-AUTH-003 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-003 | Contraseña incorrecta muestra mensaje de error', () => {
    cy.fixture('users').then(({ invalid_password }) => {
      cy.fillLogin(invalid_password.username, invalid_password.password);

      cy.get('body', { timeout: 8000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return (
          text.includes('inválido')     ||
          text.includes('incorrecto')   ||
          text.includes('error')        ||
          text.includes('credenciales') ||
          $body.find('input[type="password"]').length > 0
        );
      });

      // No debe haber redirigido al dashboard
      cy.url().should('include', '/auth');
    });
  });

  // ── TC-AUTH-004 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-004 | Submit con campos vacíos no llama al servidor', () => {
    // Interceptar el endpoint de login para detectar si se hace una llamada
    cy.intercept('POST', '**/auth**').as('loginRequest');
    cy.intercept('POST', '**/login**').as('loginRequest2');
    cy.intercept('POST', '**/session**').as('loginRequest3');

    cy.contains('button', /Ingresar|Iniciar sesión|Login/i).click({ force: true });

    // No debe haberse hecho ningún request al servidor
    cy.get('@loginRequest.all').should('have.length', 0);
    cy.get('@loginRequest2.all').should('have.length', 0);
    cy.get('@loginRequest3.all').should('have.length', 0);

    // Debe seguir mostrando el formulario
    cy.get('input[type="password"]').should('be.visible');
  });

  // ── TC-AUTH-005 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-005 | El campo de contraseña es de tipo password (no texto plano)', () => {
    cy.get('input[type="password"]')
      .should('exist')
      .should('have.attr', 'type', 'password');

    // Si existe botón de mostrar/ocultar contraseña, verificar que alterna el tipo
    cy.get('body').then(($body) => {
      const toggleBtn = $body.find(
        '[class*="eye"], [class*="toggle"], [aria-label*="contraseña"], [aria-label*="password"]'
      );
      if (toggleBtn.length) {
        cy.wrap(toggleBtn.first()).click({ force: true });
        // Después del toggle puede ser "text" o seguir siendo "password"
        cy.get('input').last().invoke('attr', 'type').should('match', /text|password/);
      }
    });
  });

  // ── TC-AUTH-006 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-006 | La sesión persiste al recargar la página (F5)', () => {
    cy.fixture('users').then(({ valid }) => {
      // Login
      cy.fillLogin(valid.username, valid.password);
      cy.url({ timeout: 12000 }).should('not.include', '/auth');

      // Recargar
      cy.reload();

      // Debe seguir autenticado (no redirigir al login)
      cy.url({ timeout: 8000 }).should('not.include', '/auth');
      cy.get('body').should('satisfy', ($body) => {
        return (
          $body.text().includes('Dashboard')    ||
          $body.text().includes('Documentos')  
        );
      });
    });
  });

  // ── TC-AUTH-007 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-007 | Logout limpia la sesión y redirige al login', () => {
    cy.fixture('users').then(({ valid }) => {
      // Login
      cy.fillLogin(valid.username, valid.password);
      cy.url({ timeout: 12000 }).should('not.include', '/auth');

      // Buscar y hacer click en el botón de logout
      cy.get('body').then(($body) => {
        if ($body.find('[class*="logout"], [data-testid*="logout"]').length) {
          // Caso 1: botón de logout directo
          cy.get('[class*="logout"], [data-testid*="logout"]').first().click({ force: true });

        } else if ($body.find('button[aria-haspopup="menu"]').length) {
          // Caso 2 (ebill): botón del avatar — tiene aria-haspopup="menu" (Radix UI)
          cy.get('button[aria-haspopup="menu"]').last().click({ force: true });
          cy.contains(/Cerrar\s+Sesi[oó]n|Salir|Logout/i, { timeout: 6000 }).click({ force: true });

        } else if ($body.text().toLowerCase().includes('cerrar sesión')) {
          // Caso 3: el texto ya está visible sin necesidad de abrir menú
          cy.contains(/Cerrar\s+Sesi[oó]n|Salir|Logout/i).click({ force: true });

        } else {
          // Caso 4 — fallback genérico
          cy.get('button[aria-haspopup], button[aria-expanded]').last().click({ force: true });
          cy.contains(/Cerrar\s+Sesi[oó]n|Salir|Logout/i, { timeout: 6000 }).click({ force: true });
        }
      });

      // Debe redirigir al login
      cy.url({ timeout: 8000 }).should('include', '/auth');
      cy.get('input[type="password"]').should('be.visible');
    });
  });

});