// =============================================================================
// Commands — API (setup / teardown de datos de prueba via backend)
// -----------------------------------------------------------------------------
// Patrón: los tests que necesitan data preexistente deben CREARLA por API
// en before/beforeEach en lugar de depender del ambiente.
// =============================================================================

/**
 * cy.apiRequest(method, path, body)
 * Wrapper sobre cy.request que añade Authorization header automáticamente si
 * Cypress.env('apiToken') existe.
 */
Cypress.Commands.add('apiRequest', (method, path, body) => {
  const base = Cypress.env('apiUrl') || `${Cypress.config('baseUrl')}/api`;
  const token = Cypress.env('apiToken');
  return cy.request({
    method,
    url: `${base}${path}`,
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    failOnStatusCode: false,
  });
});

/**
 * cy.apiCrearCliente(payload) → devuelve el cliente creado.
 * Stub: adaptar al contrato real del backend de eBill.
 */
Cypress.Commands.add('apiCrearCliente', (payload) => {
  return cy.apiRequest('POST', '/clients', payload).then((res) => {
    expect(res.status, 'crear cliente').to.be.oneOf([200, 201]);
    return res.body;
  });
});

/**
 * cy.apiBorrarCliente(id)
 */
Cypress.Commands.add('apiBorrarCliente', (id) => {
  return cy.apiRequest('DELETE', `/clients/${id}`).then((res) => {
    expect(res.status, 'borrar cliente').to.be.oneOf([200, 204]);
  });
});

/**
 * cy.apiCrearDocumento(payload) → devuelve el documento creado.
 */
Cypress.Commands.add('apiCrearDocumento', (payload) => {
  return cy.apiRequest('POST', '/documents', payload).then((res) => {
    expect(res.status, 'crear documento').to.be.oneOf([200, 201]);
    return res.body;
  });
});
