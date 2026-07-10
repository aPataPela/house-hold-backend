# Fases de desarrollo V1

Estado actualizado: 2026-06-18.

| Fase     | Entregable                                                  | Estado     |
| -------- | ----------------------------------------------------------- | ---------- |
| Reinicio | Retiro de implementación artesanal y documentación anterior | Completada |
| -1       | Arquitectura, contratos y roadmap Express/Mongoose          | Completada |
| 0        | Fundación Express, Mongo, middleware y healthchecks         | Completada |
| A        | Household, memberships y categories                         | Completada |
| B        | Preferencias y exclusiones autoservicio                     | Completada |
| C        | Registro y reparto de gastos                                | Completada |
| D        | Listado paginado y balance                                  | Completada |
| E        | Docker, CI, logging, seguridad y documentación              | Completada |
| F        | Tareas domésticas semanales rotativas                       | Completada |

## Criterio de cierre

Una fase solo se considera completada cuando compila, pasa lint y tiene pruebas automatizadas deterministas. Mongo forma parte de la aplicación desde la Fase 0; no existe una migración posterior desde almacenamiento temporal.

## Secuencia funcional

1. Crear household y ADMIN inicial.
2. Invitar memberships y crear categorías.
3. Configurar preferencias y exclusiones temporales autoservicio.
4. Registrar gastos con snapshot de reparto.
5. Consultar gastos y balance por periodo.
6. Configurar espacios comunes/tareas y generar asignaciones semanales rotativas.
