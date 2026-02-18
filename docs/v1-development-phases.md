# V1 Development Phases and Subphases

Estado actualizado: 2026-02-18

Leyenda:
- `Completada`: lista para usar y validada.
- `Parcial`: hay implementación, pero falta cerrar alcance de la fase.
- `Pendiente`: no iniciada.

## Resumen rápido
| Fase | Nombre | Estado |
|---|---|---|
| Fase -1 | Diseño y contratos V1 | Completada |
| Fase 0 | Plataforma HTTP mínima | Completada |
| Fase A | APIs base (household/membership/category) | Pendiente |
| Fase B | APIs de participación (preferences/requests) | Pendiente |
| Fase C | API transaccional RegisterExpense | Parcial |
| Fase D | APIs de lectura (list/balance) | Pendiente |
| Fase E | Persistencia Mongo real | Pendiente |

## Fase -1: Diseño y contratos V1
Estado: `Completada`

### Subfases
| Subfase | Entregable | Estado |
|---|---|---|
| -1.1 | Casos de uso V1 | Completada |
| -1.2 | Contratos REST V1 | Completada |
| -1.3 | Arquitectura por capas + puertos | Completada |
| -1.4 | Índices/queries NoSQL sugeridos | Completada |

Referencias:
- `docs/v1-application-use-cases.md`
- `docs/v1-api-rest.md`
- `docs/v1-architecture.md`
- `docs/v1-mongo-indexes-and-queries.md`
- `docs/v1-api-dependency-matrix.md`

## Fase 0: Plataforma HTTP mínima
Estado: `Completada`
Rama de cierre: `phase/0-foundation`

### Subfases
| Subfase | Entregable | Estado |
|---|---|---|
| 0.1 | `server.ts` con arranque y healthcheck | Completada |
| 0.2 | Router base `/api/v1` | Completada |
| 0.3 | Mapeo uniforme de errores (`400/403/404/409`) | Completada |
| 0.4 | Repositorios in-memory para desarrollo | Completada |
| 0.5 | Test de integración smoke HTTP | Completada |

## Fase A: APIs base
Estado: `Pendiente`

### Subfases
| Subfase | API | Estado |
|---|---|---|
| A.1 | `POST /households` | Pendiente |
| A.2 | `POST /households/{householdId}/memberships` | Pendiente |
| A.3 | `POST /households/{householdId}/categories` | Pendiente |
| A.4 | Tests de integración de flujo A (create->invite->category) | Pendiente |

## Fase B: APIs de participación
Estado: `Pendiente`

### Subfases
| Subfase | API | Estado |
|---|---|---|
| B.1 | `PUT /households/{householdId}/categories/{categoryId}/preferences/{membershipId}` | Pendiente |
| B.2 | `POST /households/{householdId}/category-participation-requests` | Pendiente |
| B.3 | `POST /households/{householdId}/category-participation-requests/{requestId}/decision` | Pendiente |
| B.4 | Tests de vigencia temporal y aprobación `ADMIN_ONLY` | Pendiente |

## Fase C: API transaccional RegisterExpense
Estado: `Parcial`

### Subfases
| Subfase | Entregable | Estado |
|---|---|---|
| C.1 | Use case `RegisterExpense` (application layer) | Completada |
| C.2 | Algoritmo weighted split con suma exacta CLP | Completada |
| C.3 | Soporte de `items` informativos | Completada |
| C.4 | Snapshot inmutable de `ExpenseShare` | Completada |
| C.5 | Unit tests casos 47.000 y 50.000 | Completada |
| C.6 | Endpoint HTTP `POST /households/{householdId}/expenses` | Pendiente |
| C.7 | Test de integración HTTP para RegisterExpense | Pendiente |

Referencias:
- `backend/src/application/use-cases/register-expense.use-case.ts`
- `backend/src/domain/services/weighted-split-calculator.ts`
- `backend/tests/register-expense.use-case.test.mjs`
- `backend/tests/weighted-split-calculator.test.mjs`

## Fase D: APIs de lectura
Estado: `Pendiente`

### Subfases
| Subfase | API | Estado |
|---|---|---|
| D.1 | `GET /households/{householdId}/expenses` | Pendiente |
| D.2 | `GET /households/{householdId}/balance` | Pendiente |
| D.3 | Paginación estable por cursor | Pendiente |
| D.4 | Tests de integración de lecturas por periodo | Pendiente |

## Fase E: Persistencia Mongo real
Estado: `Pendiente`

### Subfases
| Subfase | Entregable | Estado |
|---|---|---|
| E.1 | Implementaciones Mongo de repositorios (ports) | Pendiente |
| E.2 | Creación de índices principales | Pendiente |
| E.3 | Configuración por ambiente (`dev/test/prod`) | Pendiente |
| E.4 | Tests de integración con Mongo | Pendiente |
| E.5 | Migración de in-memory a Mongo en wiring de app | Pendiente |

## Criterio para marcar una fase como completada
1. APIs de la fase funcionando por HTTP.
2. Tests automatizados de la fase en verde.
3. Casos de borde críticos cubiertos.
4. Documentación actualizada en `docs/`.
