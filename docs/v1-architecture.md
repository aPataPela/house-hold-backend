# Arquitectura backend V1

Estado: implementada el 2026-06-18. Reorganizada el 2026-07-02.

## Stack

- Node.js 22, TypeScript estricto y Express 5.
- Mongoose sobre MongoDB replica set.
- Zod en el límite HTTP.
- Helmet, CORS y Pino HTTP como middleware operativo.
- Vitest, Supertest y MongoDB Memory Server para pruebas.

## Distribución de directorios

- `src/app/server.ts`: entrada local y base compilada para producción (`dist/app/server.js`).
- `src/app`: configuración y arranque de la aplicación.
  - `config`: variables de entorno.
  - `http/middlewares`: validación, errores, 404 y async handler.
  - `http/routes`: composición del router V1.
  - `create-app.ts`: composición testeable de Express sin abrir puerto.
  - `server.ts`: conexión Mongo, escucha y apagado.
- `src/context`: módulos funcionales de la aplicación.
  - `households`: households, memberships y categories.
  - `participation`: preferencias de reparto por categoría.
  - `expenses`: gastos, listado y balance.
  - `absences`: ausencias temporales, liquidación mensual y disponibilidad para chores.
  - `chores`: espacios comunes, tareas domésticas y asignaciones semanales.
  - `shared`: tipos, errores, serialización HTTP y utilidades comunes.

Cada contexto sigue la estructura tradicional de Express:

- `controllers`: adaptan HTTP a servicios y serializan respuestas.
- `routes`: declaran endpoints, validación y controlador.
- `services`: contienen reglas de negocio y acceso a modelos.
- `validators`: schemas Zod para body/query.
- `models`: schemas e índices Mongoose del contexto.

Cuando existan nuevos dominios funcionales, por ejemplo `users` o `payments`, se agregan como nuevos módulos dentro de `src/context`.

## Decisiones

- CLP se almacena como entero.
- Las fechas funcionales usan `YYYY-MM-DD` y se convierten a medianoche UTC.
- Los shares son snapshots históricos y siempre suman el total.
- El cursor de gastos es opaco y contiene `date + id`.
- Crear household y ADMIN inicial usa una transacción.
- `ADMIN` es un permiso adicional de una membresía residente: no la excluye de gastos, liquidaciones, ausencias ni tareas domésticas.
- Las tareas domésticas rotan semanalmente por historial de asignación y prioridad.
- Autenticación y JWT quedan fuera de V1.

## Contrato de despliegue

El frontend y la API pueden desplegarse juntos o por separado. La app queda documentada para funcionar con este contrato:

- En desarrollo, Next.js atiende el frontend en `3000` y proxya `/api` al backend local en `4000` por defecto.
- `allowedDevOrigins` sólo existe para permitir HMR desde IPs LAN durante desarrollo.
- En producción, el backend puede vivir detrás de `API_PROXY_TARGET` o en un origen distinto consumido por `NEXT_PUBLIC_API_BASE_URL`.
- El service worker se registra sólo en producción; en desarrollo se desregistran instalaciones previas para evitar caché vieja al probar la app.

Cuando se cambie la topología de red o el hosting, este contrato debe revisarse antes del despliegue.
