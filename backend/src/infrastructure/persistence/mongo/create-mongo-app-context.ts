import type { AppContext } from "../app-context.js";
import { ensureMongoIndexes } from "./mongo-indexes.js";
import {
  createMongoRepositories,
  type MongoDb,
} from "./mongo-repositories.js";

export interface CreateMongoAppContextInput {
  mongoUri: string;
  mongoDbName: string;
  autoCreateIndexes: boolean;
}

interface MongoClientLike {
  connect(): Promise<void>;
  db(name: string): MongoDb;
  close(): Promise<void>;
}

interface MongoDriverModule {
  MongoClient: new (uri: string) => MongoClientLike;
}

export const createMongoAppContext = async (
  input: CreateMongoAppContextInput,
): Promise<AppContext> => {
  const mongoDriver = await loadMongoDriver();
  const client = new mongoDriver.MongoClient(input.mongoUri);
  await client.connect();

  const database = client.db(input.mongoDbName);
  const repositories = createMongoRepositories(database);

  if (input.autoCreateIndexes) {
    await ensureMongoIndexes(database);
  }

  return {
    kind: "mongo",
    repositories,
    dispose: async () => {
      await client.close();
    },
  };
};

const loadMongoDriver = async (): Promise<MongoDriverModule> => {
  try {
    const moduleName = "mongodb";
    return (await import(moduleName)) as unknown as MongoDriverModule;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Mongo persistence requires the 'mongodb' package. Install it with 'npm install mongodb'. Detail: ${detail}`,
    );
  }
};
