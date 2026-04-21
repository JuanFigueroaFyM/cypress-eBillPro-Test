// =============================================================================
// e2e.js — Setup global de la suite.
// -----------------------------------------------------------------------------
// Cypress carga este archivo antes de cada spec. Aquí se registran:
//   • Reporter Mochawesome
//   • Custom commands (barrel)
//   • Manejo de uncaught:exception con lista blanca restrictiva
// =============================================================================

import 'cypress-mochawesome-reporter/register';

// Filtrado por título y tags (@smoke, @regression, etc.) con @cypress/grep.
// IMPORTANTE: debe importarse aquí (support file) para que filtre tests dentro
// del browser. El plugin de Node en cypress.config.js solo filtra a nivel de spec.
import '@cypress/grep';

// Carga todos los custom commands (auth, navigation, api, logging).
import './commands';

// ─── Filtro de errores de terceros ──────────────────────────────────────────
// SOLO silenciar ruido conocido. NO incluir el dominio propio de la app —
// eso oculta bugs reales del frontend.
const THIRD_PARTY_NOISE = [
  /freshchat/i,
  /fcWidget/i,
  /ResizeObserver loop (limit exceeded|completed)/i, // falso positivo común
  /Non-Error promise rejection captured/i, // idem
];

Cypress.on('uncaught:exception', (err) => {
  if (THIRD_PARTY_NOISE.some((re) => re.test(err.message))) {
    // eslint-disable-next-line no-console
    console.warn('[e2e] Silenciado error de tercero:', err.message);
    return false;
  }
  // Dejar que el resto rompa el test — son bugs reales que deben reportarse.
  return true;
});

// ─── Config runtime derivado de cypress.env ────────────────────────────────
before(() => {
  const locale = Cypress.env('locale') || 'es-CO';
  Cypress.log({ name: 'CONFIG', message: `locale=${locale} baseUrl=${Cypress.config('baseUrl')}` });
});
