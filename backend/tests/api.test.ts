import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app/create-app";
import { version } from "../package.json";

const now = () => new Date("2026-01-01T12:00:00.000Z");
const app = createApp({ now, logging: false });
let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" } });
  await mongoose.connect(mongo.getUri(), { dbName: "household_test" });
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
}, 60_000);

beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const bootstrap = async () => {
  const household = await request(app)
    .post("/api/v1/households")
    .send({ name: "Casa Ñuñoa", currency: "CLP", createdByUserId: "usr_1" })
    .expect(201);
  const householdId = household.body.householdId as string;
  const adminId = household.body.creatorMembershipId as string;
  const member = await request(app)
    .post(`/api/v1/households/${householdId}/memberships`)
    .send({ userId: "usr_2", role: "MEMBER", invitedByMembershipId: adminId })
    .expect(201);
  const category = await request(app)
    .post(`/api/v1/households/${householdId}/categories`)
    .send({ name: "Feria", createdByMembershipId: adminId })
    .expect(201);
  return {
    householdId,
    adminId,
    memberId: member.body.membershipId as string,
    categoryId: category.body.categoryId as string,
  };
};

describe("HTTP foundation", () => {
  it("serves health and uniform errors", async () => {
    await request(app).get("/health").expect(200, { status: "UP", version });
    await request(app).get("/api/v1/health").expect(404);
    await request(app).get("/api/v1").expect(404);
    const invalid = await request(app).post("/api/v1/households").send({});
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe("VALIDATION_ERROR");
    await request(app)
      .get("/missing")
      .expect(404, { error: { code: "ROUTE_NOT_FOUND", message: "route not found" } });
  });
});

describe("V1 flow", () => {
  it("creates base resources and protects ADMIN operations", async () => {
    const setup = await bootstrap();
    await request(app)
      .post(`/api/v1/households/${setup.householdId}/memberships`)
      .send({ userId: "usr_3", role: "MEMBER", invitedByMembershipId: setup.memberId })
      .expect(403);
    await request(app)
      .post(`/api/v1/households/${setup.householdId}/categories`)
      .send({ name: " feria ", createdByMembershipId: setup.adminId })
      .expect(409);
  });

  it("applies preferences, exclusions, expense snapshots and read APIs", async () => {
    const setup = await bootstrap();
    await request(app)
      .put(
        `/api/v1/households/${setup.householdId}/categories/${setup.categoryId}/preferences/${setup.memberId}`,
      )
      .send({
        mode: "INCLUDE_DEFAULT",
        weight: 0.5,
        validFrom: "2026-01-01",
        validTo: null,
        changedByMembershipId: setup.adminId,
      })
      .expect(200);
    await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.memberId,
        categoryId: setup.categoryId,
        periodStart: "2026-03-01",
        periodEnd: "2026-04-01",
        reason: "Viaje",
        createdByMembershipId: setup.memberId,
      })
      .expect(201);

    const first = await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses`)
      .send({
        categoryId: setup.categoryId,
        payerMembershipId: setup.adminId,
        actorMembershipId: setup.adminId,
        date: "2026-02-10",
        totalAmount: 47000,
        split: { mode: "AUTO_WEIGHTED" },
      })
      .expect(201);
    expect(
      first.body.split.shares.reduce(
        (sum: number, share: { assignedAmount: number }) => sum + share.assignedAmount,
        0,
      ),
    ).toBe(47000);
    expect(first.body.split.shares).toHaveLength(2);

    const excluded = await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses`)
      .send({
        categoryId: setup.categoryId,
        payerMembershipId: setup.adminId,
        actorMembershipId: setup.adminId,
        date: "2026-03-10",
        totalAmount: 50000,
        split: { mode: "AUTO_WEIGHTED" },
      })
      .expect(201);
    expect(excluded.body.split.shares).toHaveLength(1);
    expect(excluded.body.split.shares[0].membershipId).toBe(setup.adminId);
    const list = await request(app)
      .get(`/api/v1/households/${setup.householdId}/expenses?from=2026-02-01&to=2026-04-01&limit=1`)
      .expect(200);
    expect(list.body.expenses).toHaveLength(1);
    expect(list.body.page.nextCursor).toBeTypeOf("string");
    const secondPage = await request(app)
      .get(
        `/api/v1/households/${setup.householdId}/expenses?from=2026-02-01&to=2026-04-01&limit=1&cursor=${list.body.page.nextCursor}`,
      )
      .expect(200);
    expect(secondPage.body.expenses).toHaveLength(1);
    const balance = await request(app)
      .get(`/api/v1/households/${setup.householdId}/balance?from=2026-02-01&to=2026-04-01`)
      .expect(200);
    expect(
      balance.body.members.reduce((sum: number, row: { netBalance: number }) => sum + row.netBalance, 0),
    ).toBe(0);
  });

  it("authorizes and validates category exclusions", async () => {
    const setup = await bootstrap();
    const invalidPeriod = await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.memberId,
        categoryId: setup.categoryId,
        periodStart: "2026-04-01",
        periodEnd: "2026-04-01",
        createdByMembershipId: setup.memberId,
      });
    expect(invalidPeriod.status).toBe(400);
    expect(invalidPeriod.body.error.code).toBe("INVALID_PERIOD");

    await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.adminId,
        categoryId: setup.categoryId,
        periodStart: "2026-03-01",
        periodEnd: "2026-04-01",
        createdByMembershipId: setup.memberId,
      })
      .expect(403);

    const exclusion = await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.memberId,
        categoryId: setup.categoryId,
        periodStart: "2026-03-01",
        periodEnd: "2026-04-01",
        reason: "Viaje",
        createdByMembershipId: setup.adminId,
      })
      .expect(201);
    expect(exclusion.body.exclusionId).toBeTypeOf("string");
    expect(exclusion.body.status).toBe("ACTIVE");
    expect(exclusion.body.audit.createdByMembershipId).toBe(setup.adminId);

    const overlapping = await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.memberId,
        categoryId: setup.categoryId,
        periodStart: "2026-03-15",
        periodEnd: "2026-04-15",
        createdByMembershipId: setup.adminId,
      });
    expect(overlapping.status).toBe(400);
    expect(overlapping.body.error.code).toBe("OVERLAPPING_EXCLUSION");

    await request(app)
      .post(
        `/api/v1/households/${setup.householdId}/category-exclusions/${exclusion.body.exclusionId}/cancel`,
      )
      .send({ cancelledByMembershipId: setup.memberId })
      .expect(200);

    const adminExclusion = await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.adminId,
        categoryId: setup.categoryId,
        periodStart: "2026-03-01",
        periodEnd: "2026-04-01",
        createdByMembershipId: setup.adminId,
      })
      .expect(201);

    await request(app)
      .post(
        `/api/v1/households/${setup.householdId}/category-exclusions/${adminExclusion.body.exclusionId}/cancel`,
      )
      .send({ cancelledByMembershipId: setup.memberId })
      .expect(403);

    const memberExclusion = await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.memberId,
        categoryId: setup.categoryId,
        periodStart: "2026-04-01",
        periodEnd: "2026-05-01",
        createdByMembershipId: setup.adminId,
      })
      .expect(201);

    await request(app)
      .post(
        `/api/v1/households/${setup.householdId}/category-exclusions/${memberExclusion.body.exclusionId}/cancel`,
      )
      .send({ cancelledByMembershipId: setup.adminId })
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe("CANCELLED");
        expect(res.body.audit.cancelledByMembershipId).toBe(setup.adminId);
      });
  });

  it("keeps expense snapshots after exclusions are cancelled", async () => {
    const setup = await bootstrap();
    const exclusion = await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.memberId,
        categoryId: setup.categoryId,
        periodStart: "2026-03-01",
        periodEnd: "2026-04-01",
        createdByMembershipId: setup.memberId,
      })
      .expect(201);

    const excludedExpense = await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses`)
      .send({
        categoryId: setup.categoryId,
        payerMembershipId: setup.adminId,
        actorMembershipId: setup.adminId,
        date: "2026-03-10",
        totalAmount: 50000,
        split: { mode: "AUTO_WEIGHTED" },
      })
      .expect(201);
    expect(excludedExpense.body.split.shares).toEqual([
      { membershipId: setup.adminId, assignedAmount: 50000, weightUsed: 1 },
    ]);

    await request(app)
      .post(
        `/api/v1/households/${setup.householdId}/category-exclusions/${exclusion.body.exclusionId}/cancel`,
      )
      .send({ cancelledByMembershipId: setup.memberId })
      .expect(200);

    const postCancelExpense = await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses`)
      .send({
        categoryId: setup.categoryId,
        payerMembershipId: setup.adminId,
        actorMembershipId: setup.adminId,
        date: "2026-03-11",
        totalAmount: 50000,
        split: { mode: "AUTO_WEIGHTED" },
      })
      .expect(201);
    expect(postCancelExpense.body.split.shares).toHaveLength(2);

    const list = await request(app)
      .get(`/api/v1/households/${setup.householdId}/expenses?from=2026-03-01&to=2026-03-12`)
      .expect(200);
    const persistedExcludedExpense = list.body.expenses.find(
      (expense: { expenseId: string }) => expense.expenseId === excludedExpense.body.expenseId,
    );
    expect(persistedExcludedExpense.split.shares).toEqual(excludedExpense.body.split.shares);
  });

  it("validates manual totals and strict dates", async () => {
    const setup = await bootstrap();
    await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses`)
      .send({
        categoryId: setup.categoryId,
        payerMembershipId: setup.adminId,
        actorMembershipId: setup.adminId,
        date: "2026-02-30",
        totalAmount: 100,
        split: { mode: "MANUAL", shares: [{ membershipId: setup.adminId, assignedAmount: 100 }] },
      })
      .expect(400);
    const invalidTotal = await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses`)
      .send({
        categoryId: setup.categoryId,
        payerMembershipId: setup.adminId,
        actorMembershipId: setup.adminId,
        date: "2026-02-10",
        totalAmount: 100,
        split: { mode: "MANUAL", shares: [{ membershipId: setup.adminId, assignedAmount: 90 }] },
      });
    expect(invalidTotal.status).toBe(400);
    expect(invalidTotal.body.error.code).toBe("INVALID_SHARES_TOTAL");
  });
});
