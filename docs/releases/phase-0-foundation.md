# Phase 0 Foundation - Release Note

Fecha: 2026-02-18
Rama: `phase/0-foundation`

## Objetivo de fase
Dejar una base backend ejecutable y verificable para construir APIs de negocio por fases.

## Alcance cerrado
- Servidor HTTP inicial y arranque por `npm run serve`.
- Router base con endpoints de salud:
  - `GET /health`
  - `GET /api/v1`
  - `GET /api/v1/health`
- Mapeo uniforme de errores:
  - dominio/aplicación -> `400`, `403`, `404`, `409`
  - infraestructura -> `404 ROUTE_NOT_FOUND`, `405 METHOD_NOT_ALLOWED`
  - fallback -> `500 INTERNAL_ERROR`
- Infraestructura in-memory para desarrollo local.
- Test de smoke HTTP del handler.

## Criterio de aceptación cumplido
1. Backend compila.
2. Tests automáticos pasan.
3. Fase 0 marcada como completada en roadmap.

## Comandos de verificación
```bash
cd backend
npm run typecheck
npm run test
npm run serve
```

## Próxima fase
Fase A:
- `POST /households`
- `POST /households/{householdId}/memberships`
- `POST /households/{householdId}/categories`
