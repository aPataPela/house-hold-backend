# Backend V1 (Node + TypeScript)

Implementación por capas, con foco en dominio y casos de uso.

## Ejecutar
```bash
npm run serve
```

Healthchecks:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/v1
curl http://localhost:3000/api/v1/health
```

Validación:
```bash
npm run typecheck
npm run test
```

## Estado actual
- Implementado: servidor HTTP mínimo (Fase 0) con router base `/api/v1`.
- Implementado: mapeo uniforme de errores (`404`, `405`, `500`) y mapeo de errores de aplicación (`400`, `403`, `404`, `409`).
- Implementado: repositorios in-memory para desarrollo.
- Implementado: smoke test HTTP.
- Implementado (Fase A):
  - `POST /api/v1/households`
  - `POST /api/v1/households/:householdId/memberships`
  - `POST /api/v1/households/:householdId/categories`
- Implementado (Fase B):
  - `PUT /api/v1/households/:householdId/categories/:categoryId/preferences/:membershipId`
  - `POST /api/v1/households/:householdId/category-participation-requests`
  - `POST /api/v1/households/:householdId/category-participation-requests/:requestId/decision`
- Implementado (Fase C):
  - `POST /api/v1/households/:householdId/expenses`
- Implementado: `RegisterExpense` con split `AUTO_WEIGHTED` y `MANUAL`.
- Implementado: `WeightedSplitCalculator` (largest remainder, suma exacta CLP).
- Incluye tests unitarios para casos 47.000 y 50.000.
- Contratos y casos de uso documentados en `../docs/`.
