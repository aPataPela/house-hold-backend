# Backend V1 (Node + TypeScript)

Implementación por capas, con foco en dominio y casos de uso.

## Ejecutar
```bash
npm install
npm run serve
```

Por defecto levanta en modo in-memory (`APP_PERSISTENCE_MODE=IN_MEMORY`).

### Ejecutar con Mongo
```bash
APP_PERSISTENCE_MODE=MONGO \
MONGO_URI="mongodb://localhost:27017" \
MONGO_DB_NAME="shared_household_expenses" \
MONGO_AUTO_CREATE_INDEXES=true \
npm run dev
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
npm run test:mongo
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
- Implementado (Fase D):
  - `GET /api/v1/households/:householdId/expenses?from=...&to=...&limit=...&cursor=...`
  - `GET /api/v1/households/:householdId/balance?from=...&to=...`
- Implementado (Fase E parcial):
  - Repositorios Mongo para todos los puertos de aplicación.
  - Creación automática de índices Mongo principales.
  - Selección de persistencia por entorno (`IN_MEMORY` o `MONGO`).
  - Wiring de `server.ts` para usar Mongo en runtime.
  - Test de integración Mongo opcional (`MONGO_TEST_URI`, `MONGO_TEST_DB_NAME`).
- Implementado: `RegisterExpense` con split `AUTO_WEIGHTED` y `MANUAL`.
- Implementado: `WeightedSplitCalculator` (largest remainder, suma exacta CLP).
- Incluye tests unitarios para casos 47.000 y 50.000.
- Incluye tests HTTP para lecturas por periodo (listado y balance).
- Contratos y casos de uso documentados en `../docs/`.
