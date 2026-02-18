# V1 Mongo/NoSQL: consultas e índices sugeridos (F)

## Colecciones sugeridas
- `expenses` (incluye `split.shares` snapshot e `items`).
- `memberships`
- `member_category_preferences`
- `category_participation_change_requests`

## Consultas típicas

### 1) ListExpenses(period)
Filtro principal:
- `householdId`
- `date` en `[from, to)`
- `status` (usualmente `ACTIVE`)
- opcional `categoryId`
Orden:
- `date DESC`, `id DESC` (cursor pagination)

### 2) GetHouseholdBalance(period)
Agregaciones:
- `paidByMember`: sumar `totalAmount` agrupado por `payerMembershipId`.
- `assignedToMember`: `unwind split.shares` y sumar `split.shares.assignedAmount` por `split.shares.membershipId`.
- `netBalance = paid - assigned`.

## Índices sugeridos

### expenses
1. `{ householdId: 1, date: -1, status: 1, _id: -1 }`
   - listado por periodo y cursor.
2. `{ householdId: 1, categoryId: 1, date: -1, status: 1, _id: -1 }`
   - listado con filtro por categoría.
3. `{ householdId: 1, payerMembershipId: 1, date: 1, status: 1 }`
   - componente `paidByMember` de balance.
4. `{ householdId: 1, "split.shares.membershipId": 1, date: 1, status: 1 }` (multikey)
   - componente `assignedToMember` de balance.

### memberships
5. `{ householdId: 1, status: 1, userId: 1 }`
   - resolver miembros activos por casa y validación de duplicados.

### member_category_preferences
6. `{ householdId: 1, categoryId: 1, membershipId: 1, validFrom: 1, validTo: 1 }`
   - lookup de preferencia vigente por fecha.

### category_participation_change_requests
7. `{ householdId: 1, categoryId: 1, membershipId: 1, status: 1, periodStart: 1, periodEnd: 1 }`
   - exclusiones aprobadas vigentes en una fecha.

## Notas de modelado NoSQL
- Mantener `split.shares` embebido en `expenses` (snapshot histórico).
- Evitar recalcular históricos; balances se obtienen por agregación en rango.
- Si crecimiento aumenta, considerar colección derivada `expense_shares` para acelerar agregaciones de balance.
