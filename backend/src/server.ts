import { createHttpServer } from "./infrastructure/http/create-http-server.js";

const env = (
  globalThis as unknown as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }
).process?.env ?? {};

const rawPort = env.PORT;
const parsedPort = rawPort ? Number.parseInt(rawPort, 10) : NaN;
const port = Number.isNaN(parsedPort) ? 3000 : parsedPort;
const host = env.HOST ?? "0.0.0.0";

const server = createHttpServer();

server.listen(port, host, () => {
  console.log(`[http] listening on http://${host}:${port}`);
});
