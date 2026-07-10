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
  - Body: `{ "mode": "HALF", "validFrom": "2026-01-01", "validTo": null, "changedByMembershipId": "m_1" }`
  - Modos públicos iniciales: `PARTICIPATES`, `HALF`, `NO_PARTICIPATES`.
  - Durante la transición también se aceptan `INCLUDE_DEFAULT` y `EXCLUDE_DEFAULT` para datos antiguos.
  - Actualiza la regla cuando coincide exactamente el periodo; rechaza otros periodos solapados. Responde `200`.
- `GET /households/{householdId}/participation-rules?on=2026-02-01`
  - Requiere sesión y una membresía activa en la casa.
  - Lista preferencias vigentes en la fecha y exclusiones activas actuales o futuras. Responde `200`.
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
  - Los shares deben usar memberships activas y sumar exactamente `totalAmount`. Si el pagador participa en el reparto, su cuota queda auto-saldada por backend al registrar el gasto. Responde `201`.
- `GET /households/{householdId}/expenses?from=2026-02-01&to=2026-03-01&limit=50&cursor=...`
  - Filtros opcionales: `categoryId`, `status`. `nextCursor` es opaco. Responde `200`.
- `POST /households/{householdId}/expenses/{expenseId}/payments`
  - Body: `{ "membershipId": "m_2", "amount": 12000, "createdByMembershipId": "m_2" }`
  - Registra un abono parcial o total sobre el share de un miembro. `amount` no puede superar el saldo pendiente del share. Responde `201`.
- `GET /households/{householdId}/balance?from=2026-02-01&to=2026-03-01`
  - `netBalance = paid - assigned`; los pagos de deuda cuentan como movimientos del período y la suma de saldos es cero. Responde `200`.

## Tareas domésticas

- `POST /households/{householdId}/common-areas`
  - Body: `{ "name": "Baño 2do piso", "createdByMembershipId": "m_1" }`
  - Solo ADMIN activo. Crea un espacio común mantenible. Responde `201`.
- `POST /households/{householdId}/chores/tasks`
  - Body: `{ "commonAreaId": "area_1", "name": "Mantener baño", "priority": 1, "assigneeLimit": 2, "createdByMembershipId": "m_1" }`
  - Solo ADMIN activo. `priority` menor significa mayor importancia; `assigneeLimit` define cuántos miembros puede recibir esa tarea por semana. Responde `201`.
- `GET /households/{householdId}/chores/tasks`
  - Lista tareas activas con su espacio común. Responde `200`.
- `POST /households/{householdId}/chores/weeks`
  - Body: `{ "weekStart": "2026-01-05", "createdByMembershipId": "m_1" }`
  - Solo ADMIN activo. `weekStart` debe ser lunes. Genera asignaciones rotativas idempotentes: cada miembro activo recibe máximo una tarea, se cubren primero las tareas más prioritarias y luego cupos extra. Responde `201`.
- `GET /households/{householdId}/chores/weeks/{weekStart}`
  - Consulta tareas asignadas de una semana. `weeklyStatus` es `DONE` solo si todos los asignados marcaron `DONE`; `NOT_DONE` si alguno marcó `NOT_DONE`; si no, `PENDING`. Responde `200`.
- `PATCH /households/{householdId}/chores/assignments/{assignmentId}`
  - Body: `{ "status": "DONE", "markedByMembershipId": "m_2" }`
  - Solo el miembro asignado puede marcar su asignación como `DONE` o `NOT_DONE`. Responde `200`.
