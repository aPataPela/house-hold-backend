# Phase E Mongo Persistence - Release Note

Fecha: 2026-02-18
Rama: `dev`

## Objetivo de fase
Agregar persistencia Mongo real sin romper compatibilidad con el modo in-memory usado en pruebas y desarrollo rápido.

## Alcance implementado
- Repositorios Mongo para todos los puertos:
  - `HouseholdRepository`
  - `MembershipRepository`
  - `CategoryRepository`
  - `MemberCategoryPreferenceRepository`
  - `CategoryParticipationChangeRequestRepository`
  - `ExpenseRepository`
  - `HouseholdBalanceReadModel`
- Read model de balance por agregación en Mongo.
- Creación de índices principales (`ensureMongoIndexes`).
- Selector de persistencia por entorno:
  - `APP_PERSISTENCE_MODE=IN_MEMORY` (default)
  - `APP_PERSISTENCE_MODE=MONGO`
- Wiring en `server.ts` para crear el `AppContext` según ambiente y cerrar conexiones al apagar.

## Testing
- Se agregó test de configuración de persistencia:
  - `tests/phase-e-persistence-config.test.mjs`
- Se agregó test de integración Mongo opcional:
  - `tests/phase-e-mongo-integration.test.mjs`
  - requiere `MONGO_TEST_URI` y `MONGO_TEST_DB_NAME`
  - si no están definidos, se omite (`skip`)

## Estado de la fase
`Parcial`:
- E.1, E.2, E.3, E.5 completadas.
- E.4 queda parcial hasta ejecutar la integración Mongo en un entorno con instancia Mongo disponible.
