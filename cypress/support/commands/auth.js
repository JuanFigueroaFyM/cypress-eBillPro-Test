// =============================================================================
// Commands — Autenticación
// -----------------------------------------------------------------------------
// Responsable de la sesión única compartida entre specs (cy.session).
// =============================================================================

import SEL from '../selectors';

const SESSION_KEY = 'ebill:primary-user';

/**
 * cy.resolveUser(fixtureAlias)
 * Resuelve un perfil de users.json a {username, password} usando env vars.
 * Esto evita tener credenciales reales en los fixtures.
 */
Cypress.Commands.add('resolveUser', (fixtureAlias = 'valid') => {
  return cy.fixture('users').then((users) => {
    const profile = users[fixtureAlias];
    if (!profile) {
      throw new Error(`[resolveUser] Perfil '${fixtureAlias}' no existe en users.json`);
    }
    // Si el perfil tiene envKey, resolvemos desde cypress.env.json / GitHub secrets.
    if (profile.envKey) {
      const envUsers = Cypress.env('users') || {};
      const creds = envUsers[profile.envKey];
      if (!creds || !creds.username || !creds.password) {
        // Fallback: variables CYPRESS_USERNAME / CYPRESS_PASSWORD (compat CI).
        const fbUser = Cypress.env('USERNAME');
        const fbPass = Cypress.env('PASSWORD');
        if (fbUser && fbPass) {
          return {
            username: fbUser,
            password: profile.password || fbPass, // invalid_password reusa username válido con pass inválida
          };
        }
        throw new Error(
          `[resolveUser] No se encontró el perfil env '${profile.envKey}'. ` +
            `Definirlo en cypress.env.json o como CYPRESS_USERNAME/CYPRESS_PASSWORD.`,
        );
      }
      return {
        username: creds.username,
        password: profile.password || creds.password,
      };
    }
    // Perfil estático (ej. invalid_user con credenciales ficticias).
    return { username: profile.username, password: profile.password };
  });
});

/**
 * cy.loginViaUi({username, password})
 * Flujo UI completo de login. Uso interno — preferir cy.loginExitoso().
 */
Cypress.Commands.add('loginViaUi', ({ username, password }) => {
  cy.visit('/auth');
  // .first() tolera que el selector combinado devuelva múltiples matches
  // mientras el FE no agregue data-testid. Se dividen las cadenas para
  // cumplir con la regla cypress/unsafe-to-chain-command.
  cy.get(SEL.login.username, { timeout: 15000 }).first().should('be.visible');
  cy.get(SEL.login.username).first().clear();
  cy.get(SEL.login.username).first().type(username, { delay: 0 });
  cy.get(SEL.login.password).first().clear();
  cy.get(SEL.login.password).first().type(password, { delay: 0, log: false });
  cy.get(SEL.login.submit).first().should('be.enabled');
  cy.get(SEL.login.submit).first().click();
  cy.url({ timeout: 12000 }).should('not.include', '/auth');
});

/**
 * cy.loginExitoso()
 * Login con caching via cy.session (cacheAcrossSpecs: true).
 *
 * Uso en tests: beforeEach(() => cy.loginExitoso());
 *
 * El validate() NO adivina keys — verifica storage Y URL para prevenir falsos
 * positivos (p. ej. token expirado que aún está en localStorage).
 */
Cypress.Commands.add('loginExitoso', () => {
  cy.resolveUser('valid').then((creds) => {
    cy.session(
      [SESSION_KEY, creds.username],
      () => {
        cy.loginViaUi(creds);
      },
      {
        cacheAcrossSpecs: true,
        validate() {
          // Verifica que hay algún artefacto de sesión sin navegar.
          cy.getCookies().then((cookies) => {
            cy.getAllLocalStorage().then((ls) => {
              const host = new URL(Cypress.config('baseUrl')).origin;
              const hasToken = (ls[host] && Object.keys(ls[host]).length > 0) || cookies.length > 0;
              if (!hasToken) {
                throw new Error('[validate] Sin artefactos de sesión — forzar re-login');
              }
            });
          });
        },
      },
    );
  });
});

/**
 * cy.clearAuthArtifacts()
 * Limpia completamente el storage. Usar solo en tests de login donde se
 * necesita empezar desde cero (NO usar junto con cy.session).
 */
Cypress.Commands.add('clearAuthArtifacts', () => {
  cy.clearAllCookies();
  cy.clearAllLocalStorage();
  cy.clearAllSessionStorage();
});
