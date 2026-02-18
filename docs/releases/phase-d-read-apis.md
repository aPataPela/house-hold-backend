# Phase D Read APIs - Release Note

Fecha: 2026-02-18
Rama: `dev`

## Objetivo de fase
Exponer endpoints de lectura por periodo para gastos y balance consolidado de un household.

## Alcance cerrado
- `GET /api/v1/households/:householdId/expenses`
  - filtros: `from`, `to`, `categoryId`, `status`
  - paginacion por cursor (`limit`, `cursor`)
- `GET /api/v1/households/:householdId/balance`
  - periodo `from`/`to`
  - consolidado por `membershipId` con `paid`, `assigned`, `netBalance`

## Reglas aplicadas
- `from < to` requerido en ambos casos de uso.
- `status` permitido: `ACTIVE | CANCELLED`.
- `limit` entero positivo con maximo 200.
- `GetHouseholdBalance` considera solo gastos `ACTIVE` para el periodo.

## Validacion ejecutada
```bash
cd backend
npm run typecheck
npm run test
```

Resultado:
- typecheck en verde.
- tests en verde (incluye nuevo archivo `phase-d-http.test.mjs`).

## Proxima fase
Fase E:
- persistencia Mongo de repositorios y read model.
