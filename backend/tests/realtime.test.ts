import http, { type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import container from "../src/app/dependency-injection";
import { createApp } from "../src/app/create-app";
import type { RealtimeOrchestrator } from "../src/realtime/contracts";
import { sharedRealtimeSubscriptionRegistry } from "../src/realtime/services/realtime-subscription-registry";

const now = () => new Date("2026-01-01T12:00:00.000Z");
const app = createApp({ now, logging: false });
let mongo: MongoMemoryReplSet;
let server: ReturnType<typeof app.listen> | undefined;
let orchestrator: RealtimeOrchestrator;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" } });
  await mongoose.connect(mongo.getUri(), { dbName: "household_realtime_test" });
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
  orchestrator = container.get("Service.Realtime.Orchestrator") as RealtimeOrchestrator;
  await orchestrator.start();
  server = app.listen(0);
}, 60_000);

beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await orchestrator?.stop();
  const currentServer = server;
  if (currentServer) {
    await new Promise<void>((resolve) => currentServer.close(() => resolve()));
  }
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const registerUser = async (input: { name: string; email: string; password?: string }) => {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({ password: "super-secret", ...input })
    .expect(201);
  return response.body as {
    user: { userId: string; email: string };
    accessToken: string;
    refreshToken: string;
  };
};

const createHousehold = async (accessToken: string, userId: string) => {
  const response = await request(app)
    .post("/api/v1/households")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name: "Casa Realtime", currency: "CLP", createdByUserId: userId })
    .expect(201);
  return response.body as {
    householdId: string;
    creatorMembershipId: string;
    inviteCode: string;
  };
};

const openRealtimeStream = (ticket: string) =>
  new Promise<{ request: http.ClientRequest; events: string[] }>((resolve, reject) => {
    const events: string[] = [];
    const currentServer = server;
    if (!currentServer) {
      reject(new Error("test server is not ready"));
      return;
    }
    const { port } = currentServer.address() as AddressInfo;
    const req = http.get(
      {
        hostname: "127.0.0.1",
        port,
        path: `/api/v1/realtime/stream?ticket=${encodeURIComponent(ticket)}`,
        headers: { accept: "text/event-stream" },
      },
      (res: IncomingMessage) => {
        if (res.statusCode !== 200) {
          reject(new Error(`unexpected SSE status ${res.statusCode}`));
          return;
        }
        res.setEncoding("utf8");
        let buffer = "";
        res.on("data", (chunk) => {
          buffer += chunk;
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";
          for (const block of blocks) {
            events.push(block);
          }
        });
        resolve({ request: req, events });
      },
    );
    req.on("error", reject);
  });

const waitForSseEvent = async (
  events: string[],
  request: http.ClientRequest,
  predicate: (event: string) => boolean,
  options?: { closeOnMatch?: boolean },
  timeoutMs = 5_000,
) => {
  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    const tick = setInterval(() => {
      if (events.some(predicate)) {
        clearInterval(tick);
        if (options?.closeOnMatch ?? true) {
          request.destroy();
        }
        resolve();
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(tick);
        request.destroy();
        reject(new Error("did not receive realtime event"));
      }
    }, 50);
  });
};

describe("Realtime protocol", () => {
  it("creates a session and streams absence events over SSE", async () => {
    const admin = await registerUser({ name: "Admin", email: "realtime-admin@mail.com" });
    const household = await createHousehold(admin.accessToken, admin.user.userId);

    const sessionResponse = await request(app)
      .post("/api/v1/realtime/sessions")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ householdId: household.householdId })
      .expect(201);

    expect(sessionResponse.body.ticket).toEqual(expect.any(String));
    expect(sessionResponse.body.expiresAt).toEqual(expect.any(String));

    const stream = await openRealtimeStream(sessionResponse.body.ticket as string);
    await new Promise((resolve) => setTimeout(resolve, 250));

    await request(app)
      .post(`/api/v1/households/${household.householdId}/absences`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        membershipId: household.creatorMembershipId,
        periodStart: "2026-01-02",
        periodEnd: "2026-01-04",
        createdByMembershipId: household.creatorMembershipId,
      })
      .expect(201);

    await waitForSseEvent(stream.events, stream.request, (event) => event.includes("event: absence.created"));
    for (const connection of sharedRealtimeSubscriptionRegistry.list(household.householdId)) {
      connection.close();
    }
  });
});
