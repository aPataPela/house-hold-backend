# Casa Viva Frontend

PWA mobile-first con Next.js, React y TypeScript para la experiencia de hogar compartido.

## Desarrollo

```bash
npm install
npm run dev
```

Por defecto, el navegador llama a `/api` en el mismo origen y Next reenvía esas solicitudes a la API local en `http://127.0.0.1:4000`. Esto permite abrir la aplicación desde otro dispositivo de la red sin configurar la IP del computador.

Variables opcionales:

```bash
API_PROXY_TARGET=http://127.0.0.1:4000
NEXT_ALLOWED_DEV_ORIGINS=mi-host-adicional.local
```

`NEXT_PUBLIC_API_BASE_URL` solo debe definirse cuando el navegador tenga que llamar directamente a una API externa. No debe apuntar a `localhost` si la aplicación se abrirá desde un celular.

### Contrato de red para producción

En producción hay dos configuraciones válidas:

1. Mantener Next.js como frontend y usar un reverse proxy o `API_PROXY_TARGET` para reenviar `/api` hacia la API.
2. Exponer la API en un origen separado y definir `NEXT_PUBLIC_API_BASE_URL` con una URL alcanzable desde el navegador.

No mezclar `localhost` en variables públicas si la app se abrirá fuera del computador donde corre el backend.

## Backend local

La API usa `4000` y el frontend usa `3000`.

```bash
cd ../backend
PORT=4000 MONGO_URI="mongodb://localhost:27017/household?replicaSet=rs0" npm run dev
```

En otro dispositivo conectado a la misma red, abre la URL `Network` que imprime Next, por ejemplo `http://192.168.100.103:3000`. Las IP LAN detectadas se agregan automáticamente a `allowedDevOrigins` para habilitar el WebSocket de recarga de Next.

Esto es sólo para desarrollo. `allowedDevOrigins` no se usa como requisito de producción.

La app guarda la sesión V1 en `localStorage` (`accessToken`, `refreshToken` y casa activa) y envía `Authorization: Bearer` en las llamadas autenticadas.

## Experiencia principal

La navegación prioriza cuatro casos de uso:

- `Inicio`: saldo personal, gasto mensual y movimientos recientes.
- `Gastos`: registro y consulta por mes y categoría.
- `Reglas`: participación, media participación y pausas temporales por categoría.
- `Casa`: integrantes, invitación, ayuda y acceso secundario a tareas domésticas.

Los períodos de gastos se calculan a partir del mes seleccionado. Los datos operativos se leen nuevamente desde la API; `localStorage` se limita a sesión, caché ligera del hogar y estado del tutorial.

## Módulos de interfaz

- `features/expenses`: listado y diálogo de registro de gastos.
- `features/home`: resumen mensual.
- `features/rules`: preferencias y exclusiones temporales.
- `features/tutorial`: configuración declarativa y diálogo accesible de la guía.
- `lib/domain.ts`: contratos compartidos del frontend.
- `lib/date.ts` y `lib/format.ts`: fechas y presentación de datos.

El tutorial se muestra por usuario y casa. Su clave incluye una versión (`casa-viva-tutorial:v1:{userId}:{householdId}`), por lo que una futura revisión importante puede incrementar la versión y volver a mostrar la guía. El usuario puede repetirla desde `Casa`.

## Despliegue

Antes de publicar:

- Verifica que el backend esté escuchando en el puerto esperado por la infraestructura.
- Define `API_PROXY_TARGET` si Next va a proxyear `/api` a un backend local o interno.
- Define `NEXT_PUBLIC_API_BASE_URL` sólo si el frontend debe hablar directo con una API externa.
- Confirma que no exista un service worker viejo en el navegador si la app ya estuvo instalada en modo PWA de desarrollo.

En producción, el registro del service worker ocurre sólo cuando `NODE_ENV === "production"`.

## Verificación

```bash
npm run typecheck
npm run lint
npm run build
```
