import type { AppContext } from "./app-context.js";
import { createInMemoryAppContext } from "./in-memory/create-in-memory-app-context.js";
import { createMongoAppContext } from "./mongo/create-mongo-app-context.js";
import { parsePersistenceConfig } from "./persistence-config.js";

export const createAppContextFromEnv = async (
  env: Record<string, string | undefined>,
): Promise<AppContext> => {
  const config = parsePersistenceConfig(env);

  if (config.mode === "MONGO") {
    return createMongoAppContext({
      mongoUri: config.mongoUri,
      mongoDbName: config.mongoDbName,
      autoCreateIndexes: config.autoCreateIndexes,
    });
  }

  return createInMemoryAppContext();
};
