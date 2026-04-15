// Registro del reporter Mochawesome (requerido para generar HTML)
import 'cypress-mochawesome-reporter/register';

// Comandos personalizados del proyecto
import './commands';

// Suprimir errores del widget FreshChat (tercero) para que
// no contaminen los resultados de los tests
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('freshchat') ||
    err.message.includes('fcWidget')  ||
    err.message.includes('fymtech')
  ) {
    return false;
  }
});
