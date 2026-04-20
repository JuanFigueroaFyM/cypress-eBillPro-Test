// =============================================================================
// documentFactory — Genera payloads de documento (factura).
// =============================================================================

import { buildClient } from './clientFactory';

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * buildDocument(overrides)
 * Devuelve un payload listo para POST /documents.
 */
export const buildDocument = (overrides = {}) => ({
  tipo: 'FACTURA',
  prefijo: 'SETT',
  numero: randomNumber(100000, 999999),
  fechaEmision: new Date().toISOString().slice(0, 10),
  cliente: buildClient(),
  items: [
    {
      codigo: 'SRV-001',
      descripcion: 'Servicio QA',
      cantidad: 1,
      precioUnitario: 100000,
      impuestoIva: 19,
    },
  ],
  moneda: 'COP',
  ...overrides,
});
