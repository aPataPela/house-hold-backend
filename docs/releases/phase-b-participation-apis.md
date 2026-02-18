# Phase B Participation APIs - Release Note

Fecha: 2026-02-18
Rama: `phase/b-participation-apis`

## Objetivo de fase
Implementar APIs de configuración de participación por categoría y flujo de aprobación de exclusiones temporales.

## Alcance cerrado
- `PUT /api/v1/households/:householdId/categories/:categoryId/preferences/:membershipId`
  - crea preferencia por categoría (`INCLUDE_DEFAULT` o `EXCLUDE_DEFAULT`)
  - valida vigencia temporal y no solapamiento por `membershipId + categoryId`
- `POST /api/v1/households/:householdId/category-participation-requests`
  - crea solicitud `TEMPORARY_EXCLUDE` en estado `PENDING`
- `POST /api/v1/households/:householdId/category-participation-requests/:requestId/decision`
  - resuelve `APPROVED`/`REJECTED`
  - solo `ADMIN` puede decidir en V1 (`ADMIN_ONLY`)

## Reglas de negocio aplicadas
- Preferencias con rango válido: `validFrom < validTo` (si `validTo` existe).
- No se permiten preferencias con rangos solapados para misma combinación miembro/categoría.
- `weight > 0` para `INCLUDE_DEFAULT`.
- `requestType` permitido en V1: solo `TEMPORARY_EXCLUDE`.
- No se puede decidir una solicitud ya resuelta.

## Validación ejecutada
```bash
cd backend
npm run typecheck
npm run test
```

Resultado:
- typecheck en verde.
- tests en verde (smoke HTTP + integración Fase A y Fase B + unit tests de reparto).

## Próxima fase
Fase C/D:
- Conectar `RegisterExpense` al endpoint HTTP.
- Implementar `ListExpenses` y `GetHouseholdBalance` por HTTP.
