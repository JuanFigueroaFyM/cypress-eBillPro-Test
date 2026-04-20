// =============================================================================
// productFactory — Genera payloads de productos / servicios facturables.
// =============================================================================

const randomCode = (prefix = 'SRV') =>
  `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const buildProduct = (overrides = {}) => ({
  codigo: randomCode('SRV'),
  nombre: `Producto de prueba ${Date.now()}`,
  descripcion: 'Generado automáticamente por la suite E2E',
  precio: 50000,
  impuestoIva: 19,
  unidadMedida: 'UNIDAD',
  tipo: 'SERVICIO',
  ...overrides,
});
