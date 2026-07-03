# Contrato REST V1

Base: `/api/v1`. Fechas: `YYYY-MM-DD`. Dinero: entero CLP.

Errores:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "request validation failed",
    "details": {}
  }
}
```

## Recursos base

- `POST /households`
  - Body: `{ "name": "Casa Ñuñoa", "currency": "CLP", "createdByUserId": "usr_1" }`
  - Crea el household y su membership ADMIN inicial. Responde `201`.
- `POST /households/{householdId}/memberships`
  - Body: `{ "userId": "usr_2", "role": "MEMBER", "invitedByMembershipId": "m_1" }`
  - Solo ADMIN activo. Responde `201`.
- `POST /households/{householdId}/categories`
  - Body: `{ "name": "Feria", "createdByMembershipId": "m_1" }`
  - El nombre es único por household sin distinguir mayúsculas. Responde `201`.

## Participación

- `PUT /households/{householdId}/categories/{categoryId}/preferences/{membershipId}`
  - Body: `{ "mode": "INCLUDE_DEFAULT", "weight": 0.5, "validFrom": "2026-01-01", "validTo": null, "changedByMembershipId": "m_1" }`
  - Rechaza periodos solapados. Responde `200`.
- `POST /households/{householdId}/category-exclusions`
  - Body: `{ "membershipId": "m_2", "categoryId": "cat_1", "periodStart": "2026-03-01", "periodEnd": "2026-04-01", "reason": "Viaje", "createdByMembershipId": "m_2" }`
  - Crea una exclusión `ACTIVE` efectiva inmediatamente. Un `MEMBER` solo puede gestionarse a sí mismo; un `ADMIN` puede gestionar cualquier miembro. Rechaza periodos solapados activos. Responde `201`.
- `POST /households/{householdId}/category-exclusions/{exclusionId}/cancel`
  - Body: `{ "cancelledByMembershipId": "m_2" }`
  - Cancela sin borrar histórico. Responde `200` con estado `CANCELLED`.

## Gastos

- `POST /households/{householdId}/expenses`
  - AUTO: `{ "categoryId": "cat_1", "payerMembershipId": "m_1", "actorMembershipId": "m_1", "date": "2026-02-10", "totalAmount": 47000, "split": { "mode": "AUTO_WEIGHTED" } }`
  - MANUAL válido: `{ "categoryId": "cat_1", "payerMembershipId": "m_1", "actorMembershipId": "m_1", "date": "2026-02-10", "totalAmount": 47000, "split": { "mode": "MANUAL", "shares": [{ "membershipId": "m_1", "assignedAmount": 23500 }, { "membershipId": "m_2", "assignedAmount": 23500 }] } }`
  - Los shares deben usar memberships activas y sumar exactamente `totalAmount`. Responde `201`.
- `GET /households/{householdId}/expenses?from=2026-02-01&to=2026-03-01&limit=50&cursor=...`
  - Filtros opcionales: `categoryId`, `status`. `nextCursor` es opaco. Responde `200`.
- `GET /households/{householdId}/balance?from=2026-02-01&to=2026-03-01`
  - `netBalance = paid - assigned`; la suma de saldos es cero. Responde `200`.
