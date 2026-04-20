# cypress-ebillpro-test

Proyecto de **pruebas E2E automatizadas** para **eBill Pro Go** (facturación electrónica).
Cypress 13 + Mochawesome Reporter + arquitectura **Page Object Model** + i18n listo para expansión a Europa.

---

## Tabla de contenidos

- [Stack y decisiones de arquitectura](#stack-y-decisiones-de-arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración de credenciales y ambientes](#configuración-de-credenciales-y-ambientes)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Ejecución de pruebas](#ejecución-de-pruebas)
- [Reportes de evidencia](#reportes-de-evidencia)
- [Casos de prueba](#casos-de-prueba)
- [Convenciones del equipo](#convenciones-del-equipo)
- [CI/CD](#cicd)

---

## Stack y decisiones de arquitectura

| Capa           | Decisión                                                | Rationale                                                                |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Framework      | Cypress 13                                              | Standard QA Automation web                                               |
| Patrón         | Page Object Model (`cypress/pages/`)                    | Separación de _qué_ prueba el test vs. _cómo_ interactúa con el DOM      |
| Selectores     | `data-testid` (primario) + fallback HTML estable        | Elimina fragilidad por texto o clases CSS                                |
| i18n           | Diccionario por locale (`support/i18n/`)                | Preparado para expansión a Europa (es-ES, en, etc.) sin reescribir suite |
| Datos          | Factory pattern (`fixtures/factories/`) + seed por API  | Tests auto-contenidos e idempotentes                                     |
| Sincronización | `cy.intercept` + alias (nunca `cy.wait(ms)` fijo)       | Determinismo — elimina falsos negativos por timing                       |
| Sesión         | `cy.session` con `cacheAcrossSpecs`                     | Login ejecutado una vez por suite                                        |
| Lint           | ESLint + `eslint-plugin-cypress`                        | Previene anti-patrones (`cy.wait` fijo, `force:true`, etc.)              |
| Reporter       | Mochawesome (HTML autocontenido, screenshots embebidos) | Evidencia lista para auditoría                                           |
| Tagging        | `@cypress/grep` — `@smoke`, `@regression`, `@critical`  | Permite pipelines escalonados (PR vs. nightly)                           |

---

## Requisitos previos

| Herramienta | Versión mínima          | Verificar con    |
| ----------- | ----------------------- | ---------------- |
| Node.js     | 18.x (recomendado 20.x) | `node --version` |
| npm         | 9.x                     | `npm --version`  |

Cypress descarga su propio binario automáticamente en la primera instalación.

---

## Instalación

```bash
cd cypress-ebillpro-test
npm install
cp cypress.env.example.json cypress.env.json  # completar con credenciales reales
```

---

## Configuración de credenciales y ambientes

### Credenciales (nunca comitear)

El archivo `cypress.env.json` (gitignored) contiene las credenciales reales:

```json
{
  "locale": "es-CO",
  "apiUrl": "https://ebillprogotest.facturaenlinea.co/api",
  "users": {
    "valid": {
      "username": "TU_USUARIO_TEST",
      "password": "TU_PASSWORD_TEST"
    }
  }
}
```

En CI, estas credenciales se inyectan desde GitHub Secrets:

- `CYPRESS_USERNAME`, `CYPRESS_PASSWORD` — credenciales del usuario `valid`
- `CYPRESS_RECORD_KEY` — key de Cypress Cloud

### Ambientes

Los archivos en `config/env.*.json` definen baseUrl/apiUrl por ambiente:

```bash
CYPRESS_ENV=dev  npm run cy:run   # corre contra dev
CYPRESS_ENV=test npm run cy:run   # corre contra test (default)
```

Añadir nuevo ambiente → crear `config/env.<name>.json` con `baseUrl`, `apiUrl`, `locale`, `country`.

---

## Estructura del proyecto

```
cypress-ebillpro-test/
├── config/                         # configs por ambiente (dev, test, prod, eu.es)
│   ├── env.test.json
│   ├── env.dev.json
│   ├── env.prod.json
│   └── env.eu.es.json              # placeholder expansión Europa
│
├── cypress/
│   ├── e2e/                        # specs (un subdirectorio por módulo)
│   │   ├── auth/login.cy.js
│   │   ├── clients/clientes.cy.js
│   │   └── documents/documentos.cy.js
│   │
│   ├── pages/                      # Page Object Model
│   │   ├── BasePage.js             # clase padre
│   │   ├── LoginPage.js
│   │   ├── DashboardPage.js
│   │   ├── DocumentsPage.js
│   │   ├── ClientsPage.js
│   │   ├── components/UserMenu.js
│   │   └── index.js                # barrel
│   │
│   ├── fixtures/
│   │   ├── users.json              # alias (sin credenciales)
│   │   ├── clients.json
│   │   ├── documents.json
│   │   └── factories/              # builders de payload para API seed
│   │       ├── clientFactory.js
│   │       ├── documentFactory.js
│   │       └── productFactory.js
│   │
│   └── support/
│       ├── e2e.js                  # bootstrap global
│       ├── commands.js             # entry point (delega a commands/)
│       ├── commands/               # comandos por dominio
│       │   ├── auth.js
│       │   ├── navigation.js
│       │   ├── api.js
│       │   └── logging.js
│       ├── selectors.js            # data-testid centralizados
│       └── i18n/
│           ├── index.js
│           ├── es-CO.json
│           └── es-ES.json
│
├── .github/workflows/cypress.yml   # CI (lint → smoke/regression paralelizado)
├── .eslintrc.cjs
├── .prettierrc
├── cypress.config.js               # config raíz (resuelve ambiente)
├── cypress.env.example.json        # plantilla segura (commiteada)
└── package.json
```

---

## Ejecución de pruebas

| Comando                     | Descripción                             |
| --------------------------- | --------------------------------------- |
| `npm run cy:open`           | Test Runner visual                      |
| `npm run cy:run`            | Toda la suite + genera reporte HTML     |
| `npm run cy:run:smoke`      | Solo tests con tag `@smoke`             |
| `npm run cy:run:regression` | Tests con tag `@regression`             |
| `npm run cy:run:auth`       | Solo módulo Autenticación               |
| `npm run cy:run:docs`       | Solo módulo Documentos                  |
| `npm run cy:run:clients`    | Solo módulo Clientes                    |
| `npm run cy:env:dev`        | Suite completa contra ambiente dev      |
| `npm run cy:record`         | Ejecuta y graba en Cypress Cloud        |
| `npm run lint`              | Verifica ESLint (falla si hay warnings) |
| `npm run format`            | Formatea con Prettier                   |
| `npm run verify`            | lint + format:check (usado en CI)       |

---

## Reportes de evidencia

Al finalizar `npm run cy:run`:

```
cypress/reports/
└── 2026-04-19-22-30-passed-report.html   ← autocontenido, screenshots embebidos
```

Cada reporte incluye: gráfica de resultados, duración por caso, screenshots embebidos de fallos, y retries visibles (para detectar flakiness).

---

## Casos de prueba

### Módulo: Autenticación — `cypress/e2e/auth/login.cy.js`

| ID          | Descripción                                                       | Tipo                 |
| ----------- | ----------------------------------------------------------------- | -------------------- |
| TC-AUTH-001 | Login exitoso redirige fuera de `/auth`                           | Happy path           |
| TC-AUTH-002 | Usuario inexistente muestra error genérico (no revela existencia) | Negativo / Seguridad |
| TC-AUTH-003 | Contraseña incorrecta muestra mensaje de error                    | Negativo             |
| TC-AUTH-004 | Submit con campos vacíos no dispara request                       | Validación frontend  |
| TC-AUTH-005 | Campo contraseña es de tipo `password`                            | Seguridad            |
| TC-AUTH-006 | La sesión persiste al recargar (F5)                               | Persistencia         |
| TC-AUTH-007 | Logout limpia la sesión y redirige al login                       | Cierre de sesión     |

### Módulo: Documentos — `cypress/e2e/documents/documentos.cy.js`

| ID          | Descripción                                    | Tipo       |
| ----------- | ---------------------------------------------- | ---------- |
| TC-DOC-001  | Botón Buscar deshabilitado con campos vacíos   | Validación |
| TC-DOC-001b | Botón Buscar se habilita solo con ambos campos | Validación |
| TC-DOC-002  | Búsqueda específica válida retorna documento   | Happy path |
| TC-DOC-003  | Búsqueda inexistente muestra estado vacío      | Negativo   |
| TC-DOC-004  | Tabla tiene columnas esperadas                 | Estructura |
| TC-DOC-005  | Filtro por cliente acota resultados            | Filtros    |
| TC-DOC-006  | Botón Filtros disponible                       | Filtros    |
| TC-DOC-007  | Click en resultado abre detalle (drawer)       | Navegación |

### Módulo: Clientes — `cypress/e2e/clients/clientes.cy.js`

| ID         | Descripción                            | Tipo       |
| ---------- | -------------------------------------- | ---------- |
| TC-CLI-001 | Lista carga con registros por defecto  | Happy path |
| TC-CLI-002 | Filtro reactivo por nombre             | Filtros    |
| TC-CLI-003 | Filtro reactivo por NIT                | Filtros    |
| TC-CLI-004 | Filtro reactivo por email              | Filtros    |
| TC-CLI-005 | Sin coincidencias muestra estado vacío | Negativo   |
| TC-CLI-006 | Tabla tiene columnas esperadas         | Estructura |
| TC-CLI-007 | Botón "Nuevo Cliente" visible          | UI         |
| TC-CLI-008 | Click en cliente abre modal de detalle | Navegación |

> Casos pendientes (Dashboard, Productos, Mi Empresa, CRUD completo) — ver `CONTRIBUTING.md` para el roadmap.

---

## Convenciones del equipo

Ver `CONTRIBUTING.md` para la guía completa (selectores, POM, aserciones, tags, naming).

---

## CI/CD

- `.github/workflows/cypress.yml` ejecuta:
  - **Lint** en todo push/PR (falla rápido).
  - **Smoke** (tests con `@smoke`) en cada PR, paralelizado en 2 contenedores.
  - **Regression** (suite completa) on-push-to-main, nightly 06:00 UTC, y manual. Paralelizado en 4 contenedores.
- Artefactos: reporte HTML siempre, videos/screenshots solo en fallo.
- Cypress Cloud: `projectId: jt9552` — dashboard con historial, flaky detection.

Secrets requeridos en el repo:

- `CYPRESS_RECORD_KEY`
- `CYPRESS_USERNAME`
- `CYPRESS_PASSWORD`

---

## Notas técnicas

- **Retries:** `runMode: 2` — red de seguridad, pero `saveAllAttempts: true` para detectar cuando un retry oculta flakiness real.
- **Video:** habilitado; los videos de tests exitosos se eliminan en `after:spec` para ahorrar storage.
- **Viewport:** 1280×800 px para consistencia visual en screenshots.
- **FreshChat / ResizeObserver:** ruido de terceros silenciado en `support/e2e.js` (lista blanca restrictiva).
