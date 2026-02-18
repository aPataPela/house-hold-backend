# Phase A Base APIs - Release Note

Fecha: 2026-02-18
Rama: `phase/a-base-apis`

## Objetivo de fase
Implementar APIs base para construir el estado mínimo de una casa compartida.

## Alcance cerrado
- `POST /api/v1/households`
  - crea household
  - crea membresía inicial ADMIN para el creador
- `POST /api/v1/households/:householdId/memberships`
  - invita miembro con control de permisos ADMIN
  - evita membresía activa duplicada por `userId`
- `POST /api/v1/households/:householdId/categories`
  - crea categoría por casa
  - valida unicidad case-insensitive

## Reglas de negocio aplicadas
- Moneda V1 restringida a `CLP`.
- Invitaciones solo por membresía `ADMIN` activa de la misma casa.
- Categorías únicas por nombre normalizado (`trim + lowercase`) por casa.

## Validación ejecutada
```bash
cd backend
npm run typecheck
npm run test
```

Resultado:
- typecheck en verde.
- tests en verde (incluye smoke HTTP + integración Fase A + unit tests de reparto).

## Próxima fase
Fase B:
- `SetMemberCategoryPreference`
- `RequestTemporaryExclusion`
- `ApproveRequest`
