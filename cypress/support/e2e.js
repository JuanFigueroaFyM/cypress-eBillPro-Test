// Importar comandos personalizados
import './commands';

// Reporter Mochawesome — captura screenshots automáticamente en el reporte
import 'cypress-mochawesome-reporter/register';

// Suprimir errores del widget de FreshChat (tercero) para que
// no rompan los tests
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('freshchat') ||
    err.message.includes('fcWidget') ||
    err.message.includes('fymtech')
  ) {
    return false;
  }
});