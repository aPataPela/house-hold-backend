# V1 Application Use Cases (Shared Household Expenses)

## Contexto y reglas transversales
- Moneda V1: CLP, almacenada como entero (`amount` en pesos).
- Histórico inmutable: no se eliminan gastos ni shares; se usa `status` o eventos posteriores.
- Criterio de vigencia de preferencias: una preferencia es válida si `validFrom <= D < validTo` o `validTo = null`.
- Gobernanza V1 para exclusiones temporales: `ADMIN_ONLY`.

## 1) CreateHousehold
**Objetivo:** crear una casa compartida y su configuración inicial.

**Input**
- `name: string`
- `currency: "CLP"`
- `createdByUserId: string`
- `governanceSettings.categoryParticipationApprovalMode: "ADMIN_ONLY"`

**Reglas**
- `name` no vacío.
- `currency` restringida a `CLP` en V1.

**Output**
- `householdId`
- `createdAt`
- `governanceSettings`

## 2) JoinHousehold / InviteMember (simple)
**Objetivo:** crear membresía `ACTIVE` para un `User` en una `Household`.

**Input (simple sin flujo de token externo)**
- `householdId`
- `userId`
- `role: "ADMIN" | "MEMBER"`
- `invitedByMembershipId`

**Reglas**
- Solo `ADMIN` puede invitar.
- No duplicar membresía `ACTIVE` para mismo `userId` + `householdId`.

**Output**
- `membershipId`
- `status: "ACTIVE"`
- `joinedAt`

## 3) CreateCategory
**Objetivo:** crear categoría de gasto dentro de una casa.

**Input**
- `householdId`
- `name`
- `createdByMembershipId`

**Reglas**
- `name` único por `householdId` (case-insensitive).
- Solo membresías `ACTIVE` crean categorías.

**Output**
- `categoryId`
- `name`

## 4) SetMemberCategoryPreference
**Objetivo:** establecer participación por defecto de un miembro en una categoría.

**Input**
- `householdId`
- `membershipId`
- `categoryId`
- `mode: "INCLUDE_DEFAULT" | "EXCLUDE_DEFAULT"`
- `weight: number` (default `1.0`)
- `validFrom: ISODate`
- `validTo: ISODate | null`
- `changedByMembershipId`

**Reglas**
- `weight > 0` cuando `mode = INCLUDE_DEFAULT`.
- `validFrom < validTo` si `validTo` existe.
- Solo `ADMIN` modifica preferencias de terceros (en V1).
- No deben coexistir dos preferencias activas que se solapen para el mismo (`membershipId`,`categoryId`).

**Output**
- `preferenceId`
- snapshot de preferencia vigente

## 5) RequestTemporaryExclusion
**Objetivo:** solicitar exclusión temporal de una categoría (`TEMPORARY_EXCLUDE`).

**Input**
- `householdId`
- `membershipId` (solicitante)
- `categoryId`
- `periodStart: ISODate`
- `periodEnd: ISODate` (exclusivo)
- `reason`

**Reglas**
- `periodStart < periodEnd`.
- Solo membrecía `ACTIVE` puede solicitar.
- Se crea en `PENDING`.

**Output**
- `requestId`
- `status: "PENDING"`

## 6) ApproveRequest
**Objetivo:** resolver una solicitud de exclusión temporal.

**Input**
- `householdId`
- `requestId`
- `decision: "APPROVED" | "REJECTED"`
- `decidedByMembershipId`
- `comment?`

**Reglas**
- En V1 (`ADMIN_ONLY`), solo `ADMIN` decide.
- Solo solicitudes `PENDING` pueden resolverse.
- Registrar `decidedAt` y auditoría.

**Output**
- `requestId`
- `status`
- `decision` snapshot

## 7) RegisterExpense (con items)
**Objetivo:** registrar gasto y congelar snapshot de reparto (`ExpenseShare`).

**Input**
- `householdId`
- `categoryId`
- `payerMembershipId`
- `date: ISODate`
- `totalAmount: number` (CLP entero)
- `note?`
- `items[]` informativos:
  - `description`
  - `quantity?`
  - `unit?`
  - `note?`
- `split`:
  - `mode: "AUTO_WEIGHTED"` (V1 principal) o `"MANUAL"`
  - si `MANUAL`: `shares[] { membershipId, assignedAmount }`

**AUTO_WEIGHTED - reglas**
- Participantes base: membresías `ACTIVE`.
- Aplicar `MemberCategoryPreference` vigente en `date` para include/exclude y `weight`.
- Aplicar exclusiones temporales `APPROVED` (`periodStart <= date < periodEnd`).
- Algoritmo de reparto:
  1. `raw_i = total * weight_i / sum(weights)`
  2. `floor_i = floor(raw_i)`
  3. `remainder = total - sum(floor_i)`
  4. Asignar `+1` a los `remainder` participantes con mayor fracción `raw_i - floor_i`.
- Resultado siempre entero y suma exacta al total.

**Reglas transversales**
- `ExpenseShare` es snapshot histórico inmutable.
- Cambios futuros de preferencias no recalculan gastos pasados.

**Output**
- `expenseId`
- `status: "ACTIVE"`
- `split.shares[]` snapshot final

## 8) GetHouseholdBalance(periodo)
**Objetivo:** obtener saldo neto por miembro en un rango (`from`, `to`).

**Definición operativa V1**
- `paidByMember = suma(totalAmount)` de gastos `ACTIVE` donde `payerMembershipId = member`.
- `assignedToMember = suma(ExpenseShare.assignedAmount)` de shares de gastos `ACTIVE`.
- `netBalance = paidByMember - assignedToMember`.

**Input**
- `householdId`
- `from: ISODate` (inclusive)
- `to: ISODate` (exclusivo)

**Output**
- `period`
- `members[]` con `paid`, `assigned`, `netBalance`

## 9) ListExpenses(periodo)
**Objetivo:** listar gastos por casa y rango de fecha.

**Input**
- `householdId`
- `from` (inclusive)
- `to` (exclusivo)
- `categoryId?`
- `status?` (default `ACTIVE`)
- `pagination` (`limit`, `cursor` o `offset`)

**Output**
- `expenses[]` (incluyendo `items` y `split.shares` snapshot)
- metadata de paginación
