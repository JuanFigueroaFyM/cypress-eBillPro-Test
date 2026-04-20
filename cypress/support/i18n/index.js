// =============================================================================
// i18n — Diccionario de strings visibles al usuario.
// -----------------------------------------------------------------------------
// Objetivo: no hardcodear strings en español en los tests. Preparado para la
// expansión a Europa (es-ES / it / fr / de / en) sin reescribir la suite.
//
// Uso:
//   import { t } from '../support/i18n';
//   t('doc.search.submit')  // "Buscar" en es-CO, "Buscar" en es-ES, etc.
//
// Locale activo: se resuelve desde Cypress.env('locale') con fallback a es-CO.
// =============================================================================

const dictionaries = {
  'es-CO': require('./es-CO.json'),
  'es-ES': require('./es-ES.json'),
};

const getLocale = () => {
  // eslint-disable-next-line no-undef
  const fromEnv = typeof Cypress !== 'undefined' ? Cypress.env('locale') : null;
  return fromEnv || 'es-CO';
};

/** Traduce una key del diccionario al locale activo. */
export const t = (key) => {
  const locale = getLocale();
  const dict = dictionaries[locale];
  if (!dict) {
    throw new Error(
      `[i18n] Locale '${locale}' no soportado. Disponibles: ${Object.keys(dictionaries).join(', ')}`,
    );
  }
  const value = dict[key];
  if (value === undefined) {
    // No romper el test por falta de traducción — logear y devolver la key.
    // eslint-disable-next-line no-console
    console.warn(`[i18n] Falta traducción '${key}' en locale '${locale}'.`);
    return key;
  }
  return value;
};

/** Acceso directo al diccionario completo (útil para regex dinámicos). */
export const getDictionary = () => dictionaries[getLocale()];

export default { t, getDictionary };
