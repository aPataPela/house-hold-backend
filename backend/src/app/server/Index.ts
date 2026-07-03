import container from "@app/dependency-injection";
import type ConsoleLogger from "@context/shared/infrastructure/impl/ConsoleLogger";
import { Run } from "@app/server/Run";

const logger: ConsoleLogger = container.get("Shared.Logger");
const run = new Run();

const bootstrap = async (): Promise<void> => {
  try {
    await run.start();
  } catch (error) {
    logger.error(`startup ${error instanceof Error ? error.stack : String(error)}`);
    process.exit(1);
  }
};

const shutdown = async () => {
  await run.stop();
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
process.on("uncaughtException", (error) => {
  logger.error(`uncaughtException ${error.stack}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`unhandledRejection ${reason instanceof Error ? reason.stack : String(reason)}`);
  process.exit(1);
});

void bootstrap();
