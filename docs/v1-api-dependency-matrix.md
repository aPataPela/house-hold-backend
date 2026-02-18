# V1 API Dependency Matrix and Rollout Plan

Objetivo: implementar APIs primero por independencia técnica y luego por dependencia funcional, evitando bloqueos.

## Regla de oro de orden
1. Crear identidades raíz (`household`, `membership`, `category`).
2. Configurar reglas de participación (`preferences`, `requests`).
3. Registrar transacciones (`expenses`).
4. Exponer consultas agregadas (`list`, `balance`).

## Matriz de dependencias
| Orden | API | Tipo | Depende de | Puede salir sin datos previos | Criterios de listo (DoD) |
|---|---|---|---|---|---|
| 1 | `POST /households` | Base | autenticación/`userId` actor | Sí | crea `household` + auditoría; valida `name`, `currency=CLP` |
| 2 | `POST /households/{householdId}/memberships` | Base dependiente | `householdId`, membership ADMIN actor | No | evita duplicado activo por `userId`; respeta rol actor |
| 3 | `POST /households/{householdId}/categories` | Base dependiente | `householdId`, membership ACTIVA actor | No | nombre único por casa (case-insensitive) |
| 4 | `PUT /households/{householdId}/categories/{categoryId}/preferences/{membershipId}` | Configuración | household + category + membership | No | vigencia correcta (`validFrom < validTo`), sin solapamientos |
| 5 | `POST /households/{householdId}/category-participation-requests` | Configuración | household + category + membership solicitante | No | crea `PENDING`; periodo válido |
| 6 | `POST /households/{householdId}/category-participation-requests/{requestId}/decision` | Configuración | request `PENDING` + ADMIN | No | transición única a `APPROVED/REJECTED`, guarda `decision` |
| 7 | `POST /households/{householdId}/expenses` | Transaccional | household + category + memberships + (prefs/requests opcionales) | No | snapshot shares inmutable, suma exacta CLP, items persistidos |
| 8 | `GET /households/{householdId}/expenses` | Consulta | household, expenses | Sí (vacío) | filtro por periodo y status, paginación estable |
| 9 | `GET /households/{householdId}/balance` | Consulta agregada | household, expenses, shares | Sí (saldo 0) | `paid - assigned = net`, consistente con periodo |

## Secuencia recomendada de implementación real

### Fase A: APIs base (bajo acoplamiento)
- `CreateHousehold`
- `InviteMember`
- `CreateCategory`

Notas de diseño:
- Para no bloquear el flujo, `CreateHousehold` debe dejar al creador con membresía `ADMIN` inicial.
- Si no haces esto, `InviteMember` queda bloqueado por falta de `invitedByMembershipId` válido.

### Fase B: APIs de configuración de participación
- `SetMemberCategoryPreference`
- `RequestTemporaryExclusion`
- `ApproveRequest`

Notas de diseño:
- Las preferencias y requests son inputs de `RegisterExpense`, no modifican histórico.
- Toda regla temporal debe evaluarse contra la fecha del gasto.

### Fase C: API transaccional principal
- `RegisterExpense`

Notas de diseño:
- Primero resolver participantes elegibles.
- Luego aplicar weighted split.
- Finalmente persistir snapshot de `ExpenseShare`.

### Fase D: APIs de lectura
- `ListExpenses`
- `GetHouseholdBalance`

Notas de diseño:
- Estas APIs no recalculan reglas de participación históricas; leen snapshots.

## Qué significa “API independiente” en este proyecto
- Independiente: no requiere que exista un `Expense` previo ni reglas de reparto previas.
- Dependiente: necesita IDs y estado construidos por APIs anteriores.

## Template para tu autonomía (reutilizable por endpoint)
Para cada endpoint nuevo, define siempre este bloque antes de codificar:

1. **Contrato**
- Request/response exacto con ejemplos reales.

2. **Invariantes de dominio**
- Qué debe ser siempre verdadero (ej. suma de shares = total).

3. **Dependencias de datos**
- Qué entidades deben existir y en qué estado.

4. **Errores esperados**
- `400`, `404`, `409`, `403` con código de error estable.

5. **Pruebas mínimas**
- caso feliz
- validación de borde
- regla de negocio crítica
- idempotencia o duplicidad (si aplica)

6. **Observabilidad mínima**
- log de comando (actor, householdId, recurso, resultado)

## Backlog ejecutable sugerido (siguiente sprint)
1. Levantar servidor HTTP mínimo (`Node http`) y wiring de rutas V1.
2. Implementar repositorios in-memory para Fase A y B.
3. Conectar `RegisterExpense` (ya implementado en aplicación) al adapter HTTP.
4. Agregar tests de integración HTTP para Fase A->D con flujo completo.
