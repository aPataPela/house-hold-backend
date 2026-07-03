# Household Backend V1

Aplicación Node.js + Express 5 + TypeScript + Mongoose.

## Estructura

- `src/app`: configuración del servidor, middlewares, router raíz, composición Express y arranque.
- `src/context`: módulos funcionales. Hoy contiene `households`, `participation`, `expenses` y `shared`.
- `src/app/server.ts`: entrada local y base compilada para producción (`dist/app/server.js`).

## Desarrollo

```bash
npm install
cp .env.example .env
npm run dev
```

MongoDB debe ejecutarse como replica set porque la creación de un household y su ADMIN inicial es transaccional. También puede levantarse todo desde la raíz:

```bash
docker compose up --build
```

## Validación

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
```

Las pruebas usan un replica set efímero de `mongodb-memory-server`; no requieren Mongo externo ni dependen de la fecha del sistema.
