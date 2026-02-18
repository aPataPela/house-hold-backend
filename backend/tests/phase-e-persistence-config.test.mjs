import test from "node:test";
import assert from "node:assert/strict";

import { createAppContextFromEnv } from "../dist/src/infrastructure/persistence/create-app-context.js";
import { parsePersistenceConfig } from "../dist/src/infrastructure/persistence/persistence-config.js";

test("Phase E: parse persistence config defaults to IN_MEMORY", () => {
  const config = parsePersistenceConfig({});
  assert.deepEqual(config, { mode: "IN_MEMORY" });
});

test("Phase E: parse persistence config validates MONGO mode requirements", () => {
  assert.throws(
    () => parsePersistenceConfig({ APP_PERSISTENCE_MODE: "MONGO" }),
    /MONGO_URI is required/i,
  );
});

test("Phase E: parse persistence config rejects unknown mode", () => {
  assert.throws(
    () => parsePersistenceConfig({ APP_PERSISTENCE_MODE: "POSTGRES" }),
    /APP_PERSISTENCE_MODE must be IN_MEMORY or MONGO/i,
  );
});

test("Phase E: create app context uses in-memory repositories by default", async () => {
  const appContext = await createAppContextFromEnv({});
  assert.equal(appContext.kind, "in-memory");
  assert.ok(appContext.repositories.householdRepository);
  assert.ok(appContext.repositories.expenseRepository);
});
