// =============================================================================
// clientFactory — Genera payloads válidos para crear clientes via API.
// -----------------------------------------------------------------------------
// Permite que cada test cree su propia data y sea auto-contenido.
// No depende de @faker-js/faker para no añadir dependencia pesada —
// si se desea, reemplazar las funciones random* con faker.
// =============================================================================

/**
 * NIT colombiano válido (solo estructura: 9-10 dígitos + DV calculado simple).
 * Para Europa cambiar a NIF/CIF según país.
 */
const randomDigits = (n) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

const randomWord = () => 'TEST' + Math.random().toString(36).slice(2, 8).toUpperCase();

/**
 * buildClient(overrides)
 * Devuelve un payload listo para POST /clients.
 */
export const buildClient = (overrides = {}) => {
  const nit = randomDigits(9);
  return {
    nit,
    dv: '0',
    razonSocial: `CLIENTE ${randomWord()}`,
    tipoDocumento: 'NIT',
    tipoPersona: 'JURIDICA',
    email: `qa+${nit}@fymtech.com`,
    telefono: `+57 ${randomDigits(10)}`,
    direccion: 'Carrera 10 # 20-30',
    ciudad: 'Bogotá',
    pais: 'CO',
    ...overrides,
  };
};

/** Variante de persona natural. */
export const buildClientNatural = (overrides = {}) =>
  buildClient({
    tipoDocumento: 'CC',
    tipoPersona: 'NATURAL',
    nit: randomDigits(10),
    razonSocial: `Juan Test ${randomWord()}`,
    ...overrides,
  });
