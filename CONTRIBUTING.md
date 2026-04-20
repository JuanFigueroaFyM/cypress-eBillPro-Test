# Guía de contribución — cypress-ebillpro-test

Este documento establece las convenciones no negociables del proyecto.
Cumplirlas mantiene la suite **determinística, mantenible y escalable**.

---

## 1. Anti-patrones prohibidos (revisión bloqueante en PR)

### ❌ `cy.wait(ms)` con número fijo

```js
cy.wait(800); // ❌ prohibido por ESLint
```

**Reemplazo:** alias de intercept.

```js
cy.intercept('GET', '**/clients**').as('list');
cy.wait('@list'); // ✅
```

### ❌ Aserciones permisivas del tipo OR-everywhere

```js
cy.get('body').should('satisfy', ($b) =>
  $b.text().includes('A') || $b.text().includes('B') || ...  // ❌
);
```

**Reemplazo:** aserción puntual contra un selector o texto concreto.

```js
cy.get('[data-testid="login-error"]').should('have.text', 'Credenciales inválidas');
```

Regla: si necesitas un `||` para que el test pase, el test no sabe qué valida.

### ❌ Selectores basados en texto o clases parciales

```js
cy.contains('Prefijo').closest('div').find('input'); // ❌
cy.get('[class*="logout"]'); // ❌
cy.get('input').first(); // ❌ posición
```

**Reemplazo:** `data-testid` via `cypress/support/selectors.js`.

### ❌ `{ force: true }` sin justificar

Cada `force: true` debe ir con un comentario explicando por qué no se puede
interactuar normalmente. Si no tienes justificación, **hay un bug real**.

### ❌ Credenciales o URLs hardcodeadas

- Credenciales → `cypress.env.json` (gitignored) o GitHub Secrets.
- URLs → `config/env.*.json` por ambiente.

### ❌ Strings en español hardcodeados en aserciones de texto

Usar el diccionario i18n:

```js
import { t } from '../../support/i18n';
cy.get('[data-testid="doc-search-submit"]').should('have.text', t('doc.search.submit'));
```

---

## 2. Convenciones positivas

### Naming

- Spec files: `<modulo>.cy.js` (`login.cy.js`, `documentos.cy.js`).
- Test IDs: `TC-<MOD>-NNN` (`TC-AUTH-001`, `TC-DOC-002`).
- Page Object classes: `<Nombre>Page` (`DocumentsPage`).
- Custom commands: `cy.camelCase()` (`cy.loginExitoso`).
- Fixtures: nombres en plural (`users.json`, `clients.json`).

### Page Object Model

- Una clase por pantalla en `cypress/pages/`.
- Extienden `BasePage`.
- Métodos retornan `this` para chaining salvo cuando devuelven datos.
- Tres tipos de método:
  - **Acciones**: `login()`, `searchSpecific()`
  - **Aserciones**: `shouldShowError()`, `shouldHaveResults(n)`
  - **Queries**: retornan el elemento o valor (usar con moderación)
- Nunca selector inline en métodos — siempre via `SEL` de `support/selectors.js`.

### Tagging (`@cypress/grep`)

Todos los `describe` y/o `it` llevan al menos un tag:

```js
describe('Documentos', { tags: ['@documents', '@smoke'] }, () => { ... });
it('TC-DOC-edge-001', { tags: ['@regression', '@edge'] }, () => { ... });
```

- `@smoke`: crítico, corre en cada PR (objetivo <5 min total).
- `@regression`: suite completa, nightly.
- `@critical`: flujos que bloquean facturación (DIAN, emisión).
- `@edge`: casos borde.
- Tags de módulo: `@auth`, `@documents`, `@clients`, `@products`, `@company`.

### Tests deben ser:

- **Determinísticos** — mismas entradas → mismo resultado siempre.
- **Idempotentes** — cada test crea y limpia su propia data.
- **Independientes** — pueden correr solos, en cualquier orden.
- **Rápidos** — preferir login via `cy.session`, API seed sobre UI seed.

### Datos de prueba

- **Fijos** (fixture) solo para valores que no mutan (columnas esperadas, IDs).
- **Dinámicos** (factory) para data que se crea/modifica.
- **Seed por API** en `before()` cuando el test requiere estado preexistente.

---

## 3. Orden mental antes de aprobar un PR

1. ¿El test prueba **una sola cosa concreta**?
2. ¿Las aserciones son **específicas** (no OR-everywhere)?
3. ¿Los selectores vienen de `SEL` (no inline)?
4. ¿No hay `cy.wait(ms)` fijos?
5. ¿No hay credenciales ni URLs hardcodeadas?
6. ¿Tiene tags `@smoke` / `@regression`?
7. ¿Tiene ID trazable (`TC-XXX-NNN`)?
8. ¿`npm run verify` pasa?
9. ¿Corre sin depender del ambiente (o sembra su data)?
10. ¿Los strings visibles vienen del diccionario i18n?

---

## 4. Roadmap de cobertura (pendiente)

### Sprint corriente — terminar módulos faltantes

#### Dashboard (`cypress/e2e/dashboard/`)

- [ ] TC-DASH-001 | Métricas por mes se cargan al entrar.
- [ ] TC-DASH-002 | Cambio de mes actualiza métricas.
- [ ] TC-DASH-003 | Mes sin datos muestra estado vacío (edge).
- [ ] TC-DASH-004 | Botón "Nuevo documento" lleva al flujo de emisión.

#### Documentos — CRUD

- [ ] TC-DOC-010 | Crear documento (happy path end-to-end).
- [ ] TC-DOC-011 | Crear documento con cliente nuevo inline.
- [ ] TC-DOC-012 | Validación de campos requeridos al crear.
- [ ] TC-DOC-013 | Descargar PDF de documento emitido.
- [ ] TC-DOC-014 | Anular documento (nota crédito).

#### Clientes — CRUD

- [ ] TC-CLI-010 | Crear cliente (jurídico / NIT).
- [ ] TC-CLI-011 | Crear cliente (natural / CC).
- [ ] TC-CLI-012 | Editar cliente existente.
- [ ] TC-CLI-013 | Validación de NIT duplicado.
- [ ] TC-CLI-014 | Validación de email inválido.
- [ ] TC-CLI-015 | Eliminar / desactivar cliente.

#### Productos y Servicios (`cypress/e2e/products/`)

- [ ] TC-PRD-001 | Listar productos.
- [ ] TC-PRD-002 | Crear producto.
- [ ] TC-PRD-003 | Editar producto.
- [ ] TC-PRD-004 | Filtrar por código.
- [ ] TC-PRD-005 | Eliminar producto.

#### Mi Empresa (`cypress/e2e/company/`)

- [ ] TC-COMP-001 | Editar información corporativa.
- [ ] TC-COMP-002 | Cargar logo.
- [ ] TC-COMP-003 | Validación de resolución DIAN.

### Edge cases transversales

- [ ] Caracteres especiales (ñ, áéíóú, emoji).
- [ ] XSS attempts en campos libres.
- [ ] Longitudes máximas (NIT, razón social).
- [ ] Montos grandes (> 1 billón).
- [ ] Formato decimal con coma vs. punto.
- [ ] Sesión expirada en medio de operación.
- [ ] Pérdida de conectividad durante submit.

### Preparación Europa

- [ ] Correr suite en locale `es-ES` con `env.eu.es.json`.
- [ ] Casos específicos de factura electrónica española (SII, Facturae).
- [ ] Formato de NIF/CIF español en lugar de NIT.

---

## 5. Flujo de trabajo

1. Crear branch desde `main`: `feat/TC-DOC-010-crear-documento`.
2. Implementar test + page object si es nueva pantalla.
3. Correr `npm run verify` y `npm run cy:run:smoke` localmente.
4. Abrir PR — CI corre lint + smoke paralelizado.
5. Review siguiendo el checklist de la sección 3.
6. Merge a `main` dispara regression completa.
