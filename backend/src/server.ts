import { createHttpServer } from "./infrastructure/http/create-http-server.js";
import { createAppContextFromEnv } from "./infrastructure/persistence/create-app-context.js";

const env = (
  globalThis as unknown as {
    process?: {
      env?: Record<string, string | undefined>;
      exit?: (code?: number) => void;
      once?: (event: string, listener: () => void) => void;
    };
  }
).process;

const runtimeProcess = env;
const runtimeEnv = runtimeProcess?.env ?? {};

const rawPort = runtimeEnv.PORT;
const parsedPort = rawPort ? Number.parseInt(rawPort, 10) : NaN;
const port = Number.isNaN(parsedPort) ? 3000 : parsedPort;
const host = runtimeEnv.HOST ?? "0.0.0.0";

const appContext = await createAppContextFromEnv(runtimeEnv);
const server = createHttpServer({ appContext });

server.listen(port, host, () => {
  console.log(`[http] listening on http://${host}:${port} using ${appContext.kind} persistence`);
});

const shutdown = async (signal: string) => {
  server.close(async () => {
    try {
      if (appContext.dispose) {
        await appContext.dispose();
      }
      console.log(`[http] shutdown completed after ${signal}`);
      runtimeProcess?.exit?.(0);
    } catch (error) {
      console.error("[http] shutdown error", error);
      runtimeProcess?.exit?.(1);
    }
  });
};

runtimeProcess?.once?.("SIGINT", () => {
  void shutdown("SIGINT");
});
runtimeProcess?.once?.("SIGTERM", () => {
  void shutdown("SIGTERM");
});
