# 🧪 cypress-ebillpro-test

Proyecto de pruebas **E2E automatizadas** para **eBill Pro Go** (`ebillprogotest.facturaenlinea.co`).  
Desarrollado con [Cypress 13](https://cypress.io) + Mochawesome Reporter bajo el estándar del equipo de SQA de fymtech.

---

## 📋 Tabla de contenidos

- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Configuración de credenciales](#configuración-de-credenciales)
- [Ejecución de pruebas](#ejecución-de-pruebas)
- [Reportes de evidencia](#reportes-de-evidencia)
- [Casos de prueba](#casos-de-prueba)
- [Comandos personalizados](#comandos-personalizados)

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 18.x | `node --version` |
| npm | 8.x | `npm --version` |
| Acceso a internet | — | Red con acceso a `ebillprogotest.facturaenlinea.co` |

> Cypress descarga su propio binario del navegador (Electron) automáticamente. No se requiere instalar Chrome por separado para la ejecución headless.

---

## Instalación

```bash
# 1. Descomprimir / clonar el proyecto
cd cypress-ebillpro-test

# 2. Instalar dependencias (Cypress + Mochawesome)
npm install
```

La primera vez Cypress descargará su binario (~300 MB). Ocurre solo una vez.

---

## Estructura del proyecto

```
cypress-ebillpro-test/
│
├── cypress/
│   ├── e2e/
│   │   ├── auth/
│   │   │   └── login.cy.js          # TC-AUTH-001 a 007
│   │   └── documents/
│   │       └── documentos.cy.js     # TC-DOC-001 a 007
│   │
│   ├── fixtures/
│   │   ├── users.json               # Credenciales de prueba
│   │   └── documents.json           # Datos de búsqueda y filtros
│   │
│   ├── reports/                     # Reportes HTML generados (gitignore)
│   ├── screenshots/                 # Capturas automáticas en fallos
│   │
│   └── support/
│       ├── commands.js              # cy.fillLogin, cy.loginExitoso, cy.buscarPorPrefijo…
│       └── e2e.js                   # Setup global + registro del reporter
│
├── cypress.config.js                # Configuración + Mochawesome + Cypress Cloud
├── package.json
└── README.md
```

---

## Configuración de credenciales

### `cypress/fixtures/users.json`
```json
{
  "valid":            { "username": "cinecolombiatest", "password": "soporte@1" },
  "invalid_user":     { "username": "usuario_que_no_existe", "password": "soporte@1" },
  "invalid_password": { "username": "cinecolombiatest", "password": "contraseña_incorrecta" }
}
```

### `cypress.config.js` → `env`
```js
env: {
  USERNAME: 'cinecolombiatest',
  PASSWORD: 'soporte@1',
}
```

> ⚠️ **No commitear credenciales reales.** Para CI/CD inyectar via variables de entorno:
> ```bash
> cypress run --env USERNAME=mi_usuario,PASSWORD=mi_pass
> ```

---

## Ejecución de pruebas

| Comando | Descripción |
|---|---|
| `npm run cy:open` | Modo interactivo (Test Runner visual) |
| `npm run cy:run` | Todos los specs + genera reporte HTML |
| `npm run cy:run:auth` | Solo módulo de Autenticación |
| `npm run cy:run:docs` | Solo módulo de Documentos |
| `npm run cy:run:headless` | Headless Chrome explícito |
| `npm run cy:record` | Ejecuta y graba en Cypress Cloud |

> En modo `cy:open` el reporte HTML **no** se genera. Es exclusivo de `cy:run`.

---

## Reportes de evidencia

Al finalizar `npm run cy:run` se genera automáticamente:

```
cypress/reports/
└── 2026-04-15-10-30-passed-report.html   ← un archivo autocontenido por ejecución
```

Cada reporte incluye: gráfica de resultados, duración por caso, pasos ejecutados y screenshots embebidos de los tests fallidos. Los archivos tienen timestamp único y **no se sobrescriben** (historial por fecha).

---

## Casos de prueba

### Módulo: Autenticación — `cypress/e2e/auth/login.cy.js`

| ID | Descripción | Tipo |
|---|---|---|
| TC-AUTH-001 | Login exitoso redirige fuera de `/auth` | ✅ Happy path |
| TC-AUTH-002 | Usuario inexistente muestra error sin revelar detalles | ❌ Negativo |
| TC-AUTH-003 | Contraseña incorrecta muestra mensaje de error | ❌ Negativo |
| TC-AUTH-004 | Submit con campos vacíos no llama al servidor | 🔲 Validación frontend |
| TC-AUTH-005 | El campo contraseña es de tipo `password` | 🔒 Seguridad |
| TC-AUTH-006 | La sesión persiste al recargar la página (F5) | 🔄 Persistencia |
| TC-AUTH-007 | Logout limpia la sesión y redirige al login | 🚪 Cierre de sesión |

### Módulo: Documentos — `cypress/e2e/documents/documentos.cy.js`

| ID | Descripción | Tipo |
|---|---|---|
| TC-DOC-001 | Buscar sin prefijo muestra campo obligatorio | 🔲 Validación |
| TC-DOC-002 | Buscar con prefijo válido retorna documentos | ✅ Happy path |
| TC-DOC-003 | Buscar con prefijo inexistente muestra estado vacío | ❌ Negativo |
| TC-DOC-004 | La tabla tiene las columnas esperadas (Número, Cliente, Fecha, Total) | 🔲 Estructura |
| TC-DOC-005 | El filtro por nombre de cliente acota los resultados | 🔍 Filtros |
| TC-DOC-006 | Los filtros avanzados (fecha, tipo) están disponibles | 🔍 Filtros |
| TC-DOC-007 | Hacer click en un documento abre su detalle | ✅ Navegación |

---

## Comandos personalizados

Definidos en `cypress/support/commands.js`:

### `cy.fillLogin(username, password)`
Llena el formulario de login y hace submit.

### `cy.loginExitoso()`
Login completo con credenciales del `env`. Usa `cy.session()` con `cacheAcrossSpecs: true` — la sesión se establece una sola vez y se reutiliza en toda la suite, evitando logins repetidos entre specs.

### `cy.irADocumentos()`
Navega a `/invoices` y espera que la lista cargue.

### `cy.buscarPorPrefijo(prefijo)`
Ingresa un prefijo en el campo de búsqueda y ejecuta la búsqueda.

---

## Notas técnicas

- **Base URL:** `https://ebillprogotest.facturaenlinea.co` (ambiente TEST)
- **Cypress Cloud:** `projectId: jt9552`
- **Reintentos:** 1 reintento automático en `runMode` para reducir falsos negativos
- **FreshChat:** errores del widget de tercero suprimidos globalmente
- **Viewport:** 1280×800 px fijo para consistencia visual en screenshots
