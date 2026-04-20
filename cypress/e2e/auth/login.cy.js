// =============================================================================
// Suite: Autenticación — /auth
// -----------------------------------------------------------------------------
// Refactor v2: Page Object Model + aserciones específicas + intercepts.
// NO usa should('satisfy', () => A || B || C) — cada assert responde una
// pregunta concreta.
// =============================================================================

import { LoginPage, UserMenu } from '../../pages';
import SEL from '../../support/selectors';

const loginPage = new LoginPage();
const userMenu = new UserMenu();

describe('Autenticación — /auth', { tags: ['@auth', '@smoke'] }, () => {
  beforeEach(() => {
    // Esta suite SÍ limpia storage porque prueba el flujo de login desde cero.
    // Otras suites usan cy.loginExitoso() con cy.session cached.
    cy.clearAuthArtifacts();
    loginPage.visit();
  });

  // ── TC-AUTH-001 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-001 | Login con credenciales válidas redirige fuera de /auth', () => {
    cy.resolveUser('valid').then((creds) => {
      loginPage.interceptLogin().login(creds);
      loginPage.shouldHaveRedirectedAway();
    });
  });

  // ── TC-AUTH-002 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-002 | Usuario inexistente muestra error genérico (no revela existencia)', () => {
    cy.resolveUser('invalid_user').then((creds) => {
      loginPage.interceptLogin().login(creds);
      loginPage.shouldStillBeOnLogin();
      loginPage.shouldShowError();
      loginPage.shouldNotRevealUserExistence();
    });
  });

  // ── TC-AUTH-003 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-003 | Contraseña incorrecta muestra mensaje de error', () => {
    cy.resolveUser('invalid_password').then((creds) => {
      loginPage.interceptLogin().login(creds);
      loginPage.shouldStillBeOnLogin();
      loginPage.shouldShowError();
    });
  });

  // ── TC-AUTH-004 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-004 | Submit con campos vacíos NO dispara request al servidor', () => {
    // Interceptar todas las variantes plausibles del endpoint de login.
    cy.intercept('POST', '**/auth/**').as('authReq');
    cy.intercept('POST', '**/login**').as('loginReq');
    cy.intercept('POST', '**/session**').as('sessionReq');

    // Verificar los dos diseños posibles sin cy.wait fijo.
    cy.get(SEL.login.submit).then(($btn) => {
      if ($btn.is(':disabled')) {
        // Diseño A (correcto): submit deshabilitado — no hay forma de disparar request.
        expect($btn.is(':disabled'), 'submit deshabilitado con campos vacíos').to.be.true;
      } else {
        // Diseño B: permite click pero validación frontend frena el envío.
        cy.wrap($btn).click();
        // Aserciones síncronas posteriores garantizan que el microtask del click
        // ya se procesó; si hubiera request, @*.all > 0.
        loginPage.shouldStillBeOnLogin();
        cy.get('@authReq.all').should('have.length', 0);
        cy.get('@loginReq.all').should('have.length', 0);
        cy.get('@sessionReq.all').should('have.length', 0);
      }
    });
  });

  // ── TC-AUTH-005 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-005 | El campo de contraseña es de tipo password (no texto plano)', () => {
    loginPage.passwordFieldShouldBeMasked();
  });

  // ── TC-AUTH-006 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-006 | La sesión persiste al recargar la página (F5)', () => {
    cy.resolveUser('valid').then((creds) => {
      loginPage.login(creds).shouldHaveRedirectedAway();
      cy.reload();
      cy.url({ timeout: 8000 }).should('not.include', '/auth');
    });
  });

  // ── TC-AUTH-007 ─────────────────────────────────────────────────────────────
  it('TC-AUTH-007 | Logout limpia la sesión y redirige al login', () => {
    cy.resolveUser('valid').then((creds) => {
      loginPage.login(creds).shouldHaveRedirectedAway();
      userMenu.logout();

      // Verificar que no hay artefactos de sesión significativos.
      cy.getAllLocalStorage().then((ls) => {
        const host = new URL(Cypress.config('baseUrl')).origin;
        const keys = Object.keys(ls[host] || {});
        const hasAuthKey = keys.some((k) => /(token|auth|session|user|refresh)/i.test(k));
        expect(hasAuthKey, 'localStorage limpio de claves de auth').to.be.false;
      });

      cy.get(SEL.login.password).should('be.visible');
    });
  });
});
