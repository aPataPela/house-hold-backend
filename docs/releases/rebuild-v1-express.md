# Rebuild V1: Express + Mongoose

Fecha: 2026-06-18. Rama: `dev`.

La implementación HTTP artesanal fue retirada y reemplazada por una aplicación Express 5 con TypeScript, Mongoose desde la fundación, validación Zod y pruebas Vitest/Supertest sobre Mongo efímero.

Incluye las fases 0 y A–E, contratos REST corregidos, cursor compuesto, fechas estrictas, transacción de creación inicial, Docker y CI.

El 2026-07-02 se reorganizó el backend a una estructura tradicional:

- `src/app` para configuración, middlewares, router raíz, composición Express y arranque del servidor.
- `src/context` para módulos funcionales con `controllers`, `routes`, `services`, `validators` y `models`.
