export type PersistenceMode = "IN_MEMORY" | "MONGO";

export interface InMemoryPersistenceConfig {
  mode: "IN_MEMORY";
}

export interface MongoPersistenceConfig {
  mode: "MONGO";
  mongoUri: string;
  mongoDbName: string;
  autoCreateIndexes: boolean;
}

export type PersistenceConfig = InMemoryPersistenceConfig | MongoPersistenceConfig;

export const parsePersistenceConfig = (
  env: Record<string, string | undefined>,
): PersistenceConfig => {
  const modeRaw = env.APP_PERSISTENCE_MODE?.trim().toUpperCase();
  const mode: PersistenceMode = modeRaw === "MONGO" ? "MONGO" : "IN_MEMORY";

  if (modeRaw && modeRaw !== "IN_MEMORY" && modeRaw !== "MONGO") {
    throw new Error("APP_PERSISTENCE_MODE must be IN_MEMORY or MONGO");
  }

  if (mode === "IN_MEMORY") {
    return { mode: "IN_MEMORY" };
  }

  const mongoUri = env.MONGO_URI?.trim();
  if (!mongoUri) {
    throw new Error("MONGO_URI is required when APP_PERSISTENCE_MODE=MONGO");
  }

  const mongoDbName = env.MONGO_DB_NAME?.trim() || "shared_household_expenses";
  const autoCreateIndexes = parseBoolean(env.MONGO_AUTO_CREATE_INDEXES, true);

  return {
    mode: "MONGO",
    mongoUri,
    mongoDbName,
    autoCreateIndexes,
  };
};

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(`invalid boolean value: ${value}`);
};
