# 🧪 cypress-login-ebill

Proyecto de pruebas **E2E automatizadas** para el módulo de autenticación de **eBill Pro Go** (`/auth`).  
Desarrollado con [Cypress 13](https://cypress.io) bajo el estándar del equipo de SQA de fymtech.

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
# 1. Clonar el repositorio
git clone <url-del-repo>
cd cypress-login-ebill

# 2. Instalar dependencias (incluye Cypress + reporter Mochawesome)
npm install
```

La primera vez que se ejecuten las pruebas, Cypress descargará su binario automáticamente (~300 MB). Esto solo ocurre una vez.

---

## Estructura del proyecto

```
cypress-login-ebill/
│
├── cypress/
│   ├── e2e/
│   │   └── auth/
│   │       └── login.cy.js          # Suite de pruebas de autenticación
│   │
│   ├── fixtures/
│   │   └── users.json               # Datos de prueba (credenciales)
│   │
│   ├── reports/                     # Reportes HTML generados (gitignore recomendado)
│   │
│   ├── screenshots/                 # Capturas automáticas en fallos
│   │
│   └── support/
│       ├── commands.js              # Comandos personalizados (cy.fillLogin, etc.)
│       └── e2e.js                   # Setup global + registro del reporter
│
├── cypress.config.js                # Configuración principal de Cypress
├── package.json
└── README.md
```

---

## Configuración de credenciales

Las credenciales se gestionan en **dos lugares**. Ambos deben mantenerse sincronizados:

### `cypress/fixtures/users.json`
Define los tres escenarios de usuario usados en los tests:

```json
{
  "valid": {
    "username": "usuario_valido",
    "password": "contraseña_valida"
  },
  "invalid_user": {
    "username": "usuario_que_no_existe",
    "password": "cualquier_contraseña"
  },
  "invalid_password": {
    "username": "usuario_valido",
    "password": "contraseña_incorrecta"
  }
}
```

### `cypress.config.js` → sección `env`
Usadas por el comando `cy.loginExitoso()`:

```js
env: {
  USERNAME: 'usuario_valido',
  PASSWORD: 'contraseña_valida',
}
```

> ⚠️ **No commitear credenciales reales.** Para ambientes CI/CD, inyectar via variables de entorno:
> ```bash
> cypress run --env USERNAME=mi_usuario,PASSWORD=mi_pass
> ```

---

## Ejecución de pruebas

### Modo headless (recomendado para SQA — genera reporte automáticamente)
```bash
npm run cy:run
```

### Modo headless con Chrome
```bash
npm run cy:run:headless
```

### Modo interactivo (para desarrollo y debugging)
```bash
npm run cy:open
```

> En modo interactivo (`cy:open`) el reporte HTML **no** se genera. Es exclusivo del modo `cy:run`.

---

## Reportes de evidencia

Al finalizar cada ejecución con `npm run cy:run`, se genera automáticamente un reporte HTML en:

```
cypress/reports/
└── [fecha]-[hora]-[estado]-report.html
    Ejemplo: 2026-04-13-14-30-passed-report.html
```

### Contenido del reporte

- **Gráfica resumen** (donut) con conteo de passed / failed / pending
- **Duración** total e individual por caso de prueba
- **Detalle expandible** por cada TC con pasos ejecutados
- **Screenshots embebidos** automáticamente en los tests fallidos
- Archivo **autocontenido** (un solo `.html`, sin dependencias externas) — listo para compartir por correo o Teams

### Historial de ejecuciones

Cada ejecución genera un archivo con timestamp único. Los reportes **no se sobrescriben**, permitiendo mantener un historial por fecha de ejecución del plan de pruebas.

---

## Casos de prueba

Suite: **Autenticación — `/auth`**  
Archivo: `cypress/e2e/auth/login.cy.js`

| ID | Descripción | Tipo |
|---|---|---|
| TC-AUTH-001 | Login exitoso redirige fuera de `/auth` | ✅ Happy path |
| TC-AUTH-002 | Usuario inexistente muestra error sin revelar detalles | ❌ Negativo |
| TC-AUTH-003 | Contraseña incorrecta muestra mensaje de error | ❌ Negativo |
| TC-AUTH-004 | Submit con campos vacíos no llama al servidor | 🔲 Validación frontend |
| TC-AUTH-005 | El campo de contraseña es de tipo `password` (no texto plano) | 🔒 Seguridad |
| TC-AUTH-006 | La sesión persiste al recargar la página (F5) | 🔄 Persistencia |
| TC-AUTH-007 | Logout limpia la sesión y redirige al login | 🚪 Cierre de sesión |

---

## Comandos personalizados

Definidos en `cypress/support/commands.js`:

### `cy.fillLogin(username, password)`
Llena el formulario de login y hace submit. Usado en la mayoría de los tests.

```js
cy.fillLogin('mi_usuario', 'mi_contraseña');
```

### `cy.loginExitoso()`
Realiza login completo con las credenciales definidas en `cypress.config.js → env` y espera a que el dashboard cargue. Útil como precondición en suites futuras.

```js
cy.loginExitoso();
// → El usuario ya está autenticado y en el dashboard
```

---

## Notas técnicas

- **Base URL:** `https://ebillprogotest.facturaenlinea.co` (ambiente de pruebas)
- **Reintentos:** 1 reintento automático en modo `run` para reducir falsos negativos por latencia de red
- **Errores suprimidos:** Los errores del widget FreshChat (tercero) están ignorados globalmente para no contaminar los resultados de los tests
- **Viewport:** 1280×800px fijo para consistencia visual en screenshots