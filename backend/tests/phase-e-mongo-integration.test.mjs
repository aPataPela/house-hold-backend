import test from "node:test";
import assert from "node:assert/strict";

import { buildHttpRequestHandler } from "../dist/src/infrastructure/http/create-http-server.js";
import { createAppContextFromEnv } from "../dist/src/infrastructure/persistence/create-app-context.js";
import { invoke } from "./support/http-invoke.mjs";

const mongoUri = process.env.MONGO_TEST_URI;
const mongoDbName = process.env.MONGO_TEST_DB_NAME;

test(
  "Phase E: optional Mongo integration for register/list/balance flow",
  { skip: !mongoUri || !mongoDbName },
  async () => {
    const appContext = await createAppContextFromEnv({
      APP_PERSISTENCE_MODE: "MONGO",
      MONGO_URI: mongoUri,
      MONGO_DB_NAME: mongoDbName,
      MONGO_AUTO_CREATE_INDEXES: "true",
    });

    try {
      const handler = buildHttpRequestHandler({ appContext });

      const household = await invoke(handler, {
        method: "POST",
        url: "/api/v1/households",
        body: {
          name: "Casa Mongo",
          currency: "CLP",
          createdByUserId: `usr_mongo_${Date.now()}`,
        },
      });

      assert.equal(household.statusCode, 201);

      const category = await invoke(handler, {
        method: "POST",
        url: `/api/v1/households/${household.body.householdId}/categories`,
        body: {
          name: "Feria",
          createdByMembershipId: household.body.creatorMembershipId,
        },
      });

      assert.equal(category.statusCode, 201);

      const expense = await invoke(handler, {
        method: "POST",
        url: `/api/v1/households/${household.body.householdId}/expenses`,
        body: {
          categoryId: category.body.categoryId,
          payerMembershipId: household.body.creatorMembershipId,
          actorMembershipId: household.body.creatorMembershipId,
          date: "2026-03-10",
          totalAmount: 12000,
          split: { mode: "AUTO_WEIGHTED" },
        },
      });

      assert.equal(expense.statusCode, 201);

      const listed = await invoke(handler, {
        method: "GET",
        url: `/api/v1/households/${household.body.householdId}/expenses?from=2026-03-01&to=2026-04-01`,
      });

      assert.equal(listed.statusCode, 200);
      assert.equal(listed.body.expenses.length, 1);

      const balance = await invoke(handler, {
        method: "GET",
        url: `/api/v1/households/${household.body.householdId}/balance?from=2026-03-01&to=2026-04-01`,
      });

      assert.equal(balance.statusCode, 200);
      assert.equal(balance.body.members.length, 1);
      assert.equal(balance.body.members[0].netBalance, 0);
    } finally {
      if (appContext.dispose) {
        await appContext.dispose();
      }
    }
  },
);
