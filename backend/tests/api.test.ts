import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app/create-app";
import { version } from "../package.json";

const now = () => new Date("2026-01-01T12:00:00.000Z");
const app = createApp({ now, logging: false });
let mongo: MongoMemoryReplSet;

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

describe("Auth and household onboarding", () => {
  it("registers users, rejects duplicate email and validates login", async () => {
    const registered = await registerUser({ name: "Claudia", email: "CLAUDIA@mail.com" });
    expect(registered.user.email).toBe("claudia@mail.com");
    expect(registered.accessToken).toBeTypeOf("string");
    expect(registered.refreshToken).toBeTypeOf("string");

    await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Otra", email: "claudia@mail.com", password: "super-secret" })
      .expect(409);

    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "claudia@mail.com", password: "wrong" })
      .expect(400);

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "claudia@mail.com", password: "super-secret" })
      .expect(200);
    expect(login.body.user.userId).toBe(registered.user.userId);
    expect(login.body.memberships).toEqual([]);
  });

  it("rotates refresh tokens and rejects revoked refresh tokens", async () => {
    const registered = await registerUser({ name: "Claudia", email: "claudia@mail.com" });
    const refreshed = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: registered.refreshToken })
      .expect(200);
    expect(refreshed.body.refreshToken).not.toBe(registered.refreshToken);

    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: registered.refreshToken })
      .expect(403);

    await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(204);
    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(403);
  });

  it("creates households with ADMIN membership and lets users join by invite code", async () => {
    const admin = await registerUser({ name: "Admin", email: "admin@mail.com" });
    const created = await request(app)
      .post("/api/v1/households")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Casa Ñuñoa", currency: "CLP" })
      .expect(201);
    expect(created.body.creatorMembershipId).toBeTypeOf("string");
    expect(created.body.inviteCode).toMatch(/^[A-Z2-9]{6}$/);

    const member = await registerUser({ name: "Member", email: "member@mail.com" });
    const joined = await request(app)
      .post("/api/v1/households/join")
      .set("Authorization", `Bearer ${member.accessToken}`)
      .send({ inviteCode: created.body.inviteCode, livingSince: "2026-02-01" })
      .expect(201);
    expect(joined.body.membership.role).toBe("MEMBER");
    expect(joined.body.membership.householdId).toBe(created.body.householdId);
    expect(joined.body.membership.userName).toBe("Member");
    expect(joined.body.membership.joinedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(joined.body.membership.livingSince).toBe("2026-02-01T00:00:00.000Z");

    await request(app)
      .post(`/api/v1/households/${created.body.householdId}/categories`)
      .send({ name: "Feria", createdByMembershipId: created.body.creatorMembershipId })
      .expect(201);
    await request(app)
      .post(`/api/v1/households/${created.body.householdId}/common-areas`)
      .send({ name: "Cocina", createdByMembershipId: created.body.creatorMembershipId })
      .expect(201);

    const members = await request(app)
      .get(`/api/v1/households/${created.body.householdId}/memberships`)
      .set("Authorization", `Bearer ${member.accessToken}`)
      .expect(200);
    expect(members.body.memberships.map((membership: { userName: string }) => membership.userName)).toEqual([
      "Admin",
      "Member",
    ]);

    await request(app)
      .get(`/api/v1/households/${created.body.householdId}/categories`)
      .set("Authorization", `Bearer ${member.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.categories[0].name).toBe("Feria");
      });

    await request(app)
      .get(`/api/v1/households/${created.body.householdId}/common-areas`)
      .set("Authorization", `Bearer ${member.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.areas[0].name).toBe("Cocina");
      });

    await request(app)
      .post(`/api/v1/households/${created.body.householdId}/categories`)
      .send({ name: "Gas", createdByMembershipId: joined.body.membership.membershipId })
      .expect(403);

    await request(app)
      .post("/api/v1/households/join")
      .set("Authorization", `Bearer ${member.accessToken}`)
      .send({ inviteCode: created.body.inviteCode })
      .expect(409);

    const me = await request(app)
      .get("/api/v1/me")
      .set("Authorization", `Bearer ${member.accessToken}`)
      .expect(200);
    expect(me.body.memberships).toHaveLength(1);
    expect(me.body.memberships[0].householdId).toBe(created.body.householdId);
    expect(me.body.memberships[0].livingSince).toBe("2026-02-01T00:00:00.000Z");

    await request(app)
      .post(`/api/v1/households/${created.body.householdId}/invite-code/regenerate`)
      .set("Authorization", `Bearer ${member.accessToken}`)
      .expect(403);

    const regenerated = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/invite-code/regenerate`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(regenerated.body.inviteCode).toMatch(/^[A-Z2-9]{6}$/);
    expect(regenerated.body.inviteCode).not.toBe(created.body.inviteCode);

    await request(app)
      .post("/api/v1/households/join")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ inviteCode: "BAD123" })
      .expect(404);
  });

  it("accepts past livingSince dates when joining by invite code", async () => {
    const admin = await registerUser({ name: "Admin", email: "past-admin@mail.com" });
    const created = await request(app)
      .post("/api/v1/households")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Casa Pasada", currency: "CLP" })
      .expect(201);
    const member = await registerUser({ name: "Member", email: "past-member@mail.com" });
    const joined = await request(app)
      .post("/api/v1/households/join")
      .set("Authorization", `Bearer ${member.accessToken}`)
      .send({ inviteCode: created.body.inviteCode, livingSince: "2025-12-15" })
      .expect(201);

    expect(joined.body.membership.livingSince).toBe("2025-12-15T00:00:00.000Z");
    expect(joined.body.membership.householdId).toBe(created.body.householdId);
  });

  it("lists current participation rules only for household members", async () => {
    const admin = await registerUser({ name: "Admin", email: "rules-admin@mail.com" });
    const created = await request(app)
      .post("/api/v1/households")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Casa Reglas", currency: "CLP" })
      .expect(201);
    const member = await registerUser({ name: "Member", email: "rules-member@mail.com" });
    const joined = await request(app)
      .post("/api/v1/households/join")
      .set("Authorization", `Bearer ${member.accessToken}`)
      .send({ inviteCode: created.body.inviteCode })
      .expect(201);
    const category = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/categories`)
      .send({ name: "Feria", createdByMembershipId: created.body.creatorMembershipId })
      .expect(201);

    const preferenceUrl =
      `/api/v1/households/${created.body.householdId}/categories/` +
      `${category.body.categoryId}/preferences/${joined.body.membership.membershipId}`;
    await request(app)
      .put(preferenceUrl)
      .send({
        mode: "HALF",
        validFrom: "2025-12-01",
        validTo: null,
        changedByMembershipId: created.body.creatorMembershipId,
      })
      .expect(200);
    await request(app)
      .post(`/api/v1/households/${created.body.householdId}/category-exclusions`)
      .send({
        membershipId: joined.body.membership.membershipId,
        categoryId: category.body.categoryId,
        periodStart: "2025-12-15",
        periodEnd: "2026-01-15",
        reason: "Viaje",
        createdByMembershipId: joined.body.membership.membershipId,
      })
      .expect(201);

    const rulesUrl =
      `/api/v1/households/${created.body.householdId}/participation-rules?on=2025-12-20`;
    await request(app).get(rulesUrl).expect(403);
    const rules = await request(app)
      .get(rulesUrl)
      .set("Authorization", `Bearer ${member.accessToken}`)
      .expect(200);
    expect(rules.body.preferences).toHaveLength(1);
    expect(rules.body.preferences[0].mode).toBe("HALF");
    expect(rules.body.preferences[0].weight).toBe(0.5);
    expect(rules.body.exclusions).toHaveLength(1);

    const outsider = await registerUser({ name: "Outsider", email: "rules-outsider@mail.com" });
    await request(app)
      .get(rulesUrl)
      .set("Authorization", `Bearer ${outsider.accessToken}`)
      .expect(403);
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
        mode: "HALF",
        validFrom: "2025-12-01",
        validTo: null,
        changedByMembershipId: setup.adminId,
      })
      .expect(200);
    await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.memberId,
        categoryId: setup.categoryId,
        periodStart: "2025-12-01",
        periodEnd: "2025-12-31",
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
        date: "2025-11-30",
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
    expect(first.body.settlement.shares.find((share: { membershipId: string }) => share.membershipId === setup.adminId))
      .toMatchObject({
        paidAmount: 23500,
        remainingAmount: 0,
        status: "PAID",
      });

    const excluded = await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses`)
      .send({
        categoryId: setup.categoryId,
        payerMembershipId: setup.adminId,
        actorMembershipId: setup.adminId,
        date: "2025-12-20",
        totalAmount: 50000,
        split: { mode: "AUTO_WEIGHTED" },
      })
      .expect(201);
    expect(excluded.body.split.shares).toHaveLength(1);
    expect(excluded.body.split.shares[0].membershipId).toBe(setup.adminId);
    const list = await request(app)
      .get(`/api/v1/households/${setup.householdId}/expenses?from=2025-11-01&to=2026-01-01&limit=1`)
      .expect(200);
    expect(list.body.expenses).toHaveLength(1);
    expect(list.body.page.nextCursor).toBeTypeOf("string");
    const secondPage = await request(app)
      .get(
        `/api/v1/households/${setup.householdId}/expenses?from=2025-11-01&to=2026-01-01&limit=1&cursor=${list.body.page.nextCursor}`,
      )
      .expect(200);
    expect(secondPage.body.expenses).toHaveLength(1);
    const balance = await request(app)
      .get(`/api/v1/households/${setup.householdId}/balance?from=2025-11-01&to=2026-01-01`)
      .expect(200);
    expect(
      balance.body.members.reduce((sum: number, row: { netBalance: number }) => sum + row.netBalance, 0),
    ).toBe(0);
  });

  it("reconciles auto-weighted expenses when a member joins with a retroactive livingSince", async () => {
    const admin = await registerUser({ name: "Admin", email: "retro-admin@mail.com" });
    const created = await request(app)
      .post("/api/v1/households")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Casa Retro", currency: "CLP", livingSince: "2025-12-01" })
      .expect(201);
    const category = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/categories`)
      .send({ name: "Feria", createdByMembershipId: created.body.creatorMembershipId })
      .expect(201);

    const expense = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/expenses`)
      .send({
        categoryId: category.body.categoryId,
        payerMembershipId: created.body.creatorMembershipId,
        actorMembershipId: created.body.creatorMembershipId,
        date: "2025-12-20",
        totalAmount: 10000,
        split: { mode: "AUTO_WEIGHTED" },
      })
      .expect(201);
    expect(expense.body.split.shares).toHaveLength(1);

    const member = await registerUser({ name: "Member", email: "retro-member@mail.com" });
    const invited = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/memberships`)
      .send({
        userId: member.user.userId,
        role: "MEMBER",
        invitedByMembershipId: created.body.creatorMembershipId,
        livingSince: "2025-12-10",
      })
      .expect(201);
    const memberMembershipId = invited.body.membershipId as string;

    const reloaded = await request(app)
      .get(`/api/v1/households/${created.body.householdId}/expenses?from=2025-12-01&to=2026-01-01`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(reloaded.body.expenses[0].split.shares.map((share: { membershipId: string }) => share.membershipId)).toEqual([
      created.body.creatorMembershipId,
      memberMembershipId,
    ]);
    expect(reloaded.body.expenses[0].split.shares).toEqual([
      { membershipId: created.body.creatorMembershipId, assignedAmount: 5000, weightUsed: 1 },
      { membershipId: memberMembershipId, assignedAmount: 5000, weightUsed: 1 },
    ]);
    expect(reloaded.body.expenses[0].settlement.shares).toEqual([
      expect.objectContaining({ membershipId: created.body.creatorMembershipId, assignedAmount: 5000, status: "PAID" }),
      expect.objectContaining({ membershipId: memberMembershipId, assignedAmount: 5000, status: "PENDING" }),
    ]);
  });

  it("excludes future members from expense splits until their livingSince date", async () => {
    const admin = await registerUser({ name: "Admin", email: "future-expenses-admin@mail.com" });
    const created = await request(app)
      .post("/api/v1/households")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Casa Gasto Futuro", currency: "CLP", livingSince: "2025-12-01" })
      .expect(201);
    const category = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/categories`)
      .send({ name: "Feria", createdByMembershipId: created.body.creatorMembershipId })
      .expect(201);
    const futureMember = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/memberships`)
      .send({
        userId: "usr_3",
        role: "MEMBER",
        invitedByMembershipId: created.body.creatorMembershipId,
        livingSince: "2026-01-01",
      })
      .expect(201);

    const beforeLivingSince = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/expenses`)
      .send({
        categoryId: category.body.categoryId,
        payerMembershipId: created.body.creatorMembershipId,
        actorMembershipId: created.body.creatorMembershipId,
        date: "2025-12-31",
        totalAmount: 50000,
        split: { mode: "AUTO_WEIGHTED" },
      })
      .expect(201);
    expect(beforeLivingSince.body.split.shares).toHaveLength(1);
    expect(beforeLivingSince.body.split.shares[0].membershipId).toBe(created.body.creatorMembershipId);

    const afterLivingSince = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/expenses`)
      .send({
        categoryId: category.body.categoryId,
        payerMembershipId: created.body.creatorMembershipId,
        actorMembershipId: created.body.creatorMembershipId,
        date: "2026-01-01",
        totalAmount: 50000,
        split: { mode: "AUTO_WEIGHTED" },
      })
      .expect(201);
    expect(afterLivingSince.body.split.shares.map((share: { membershipId: string }) => share.membershipId)).toEqual([
      created.body.creatorMembershipId,
      futureMember.body.membershipId,
    ]);

    const balance = await request(app)
      .get(`/api/v1/households/${created.body.householdId}/balance?from=2025-12-01&to=2026-02-01`)
      .expect(200);
    const futureRow = balance.body.members.find(
      (row: { membershipId: string }) => row.membershipId === futureMember.body.membershipId,
    );
    expect(futureRow.assigned).toBe(25000);
  });

  it("registers partial and full payments for an expense share", async () => {
    const setup = await bootstrap();
    const expense = await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses`)
      .send({
        categoryId: setup.categoryId,
        payerMembershipId: setup.adminId,
        actorMembershipId: setup.adminId,
        date: "2025-12-15",
        totalAmount: 9000,
        split: {
          mode: "MANUAL",
          shares: [{ membershipId: setup.memberId, assignedAmount: 9000 }],
        },
      })
      .expect(201);
    expect(expense.body.settlement.shares[0]).toMatchObject({
      membershipId: setup.memberId,
      assignedAmount: 9000,
      paidAmount: 0,
      remainingAmount: 9000,
      status: "PENDING",
    });

    await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses/${expense.body.expenseId}/payments`)
      .send({
        membershipId: setup.memberId,
        amount: 2500,
        createdByMembershipId: setup.memberId,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.settlement.shares[0]).toMatchObject({
          paidAmount: 2500,
          remainingAmount: 6500,
          status: "PARTIAL",
        });
      });

    const reloaded = await request(app)
      .get(`/api/v1/households/${setup.householdId}/expenses?from=2025-12-01&to=2026-01-01`)
      .expect(200);
    expect(reloaded.body.expenses[0].settlement.shares[0]).toMatchObject({
      paidAmount: 2500,
      remainingAmount: 6500,
      status: "PARTIAL",
    });

    await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses/${expense.body.expenseId}/payments`)
      .send({
        membershipId: setup.memberId,
        amount: 6500,
        createdByMembershipId: setup.memberId,
      })
      .expect(201);

    const balance = await request(app)
      .get(`/api/v1/households/${setup.householdId}/balance?from=2025-12-01&to=2026-01-02`)
      .expect(200);
    const memberRow = balance.body.members.find(
      (row: { membershipId: string }) => row.membershipId === setup.memberId,
    );
    expect(memberRow.netBalance).toBe(0);
  });

  it("authorizes and validates category exclusions", async () => {
    const setup = await bootstrap();
    const invalidPeriod = await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.memberId,
        categoryId: setup.categoryId,
        periodStart: "2025-12-31",
        periodEnd: "2025-12-31",
        createdByMembershipId: setup.memberId,
      });
    expect(invalidPeriod.status).toBe(400);
    expect(invalidPeriod.body.error.code).toBe("INVALID_PERIOD");

    await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.adminId,
        categoryId: setup.categoryId,
        periodStart: "2025-12-01",
        periodEnd: "2025-12-31",
        createdByMembershipId: setup.memberId,
      })
      .expect(403);

    const exclusion = await request(app)
      .post(`/api/v1/households/${setup.householdId}/category-exclusions`)
      .send({
        membershipId: setup.memberId,
        categoryId: setup.categoryId,
        periodStart: "2025-12-01",
        periodEnd: "2025-12-31",
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
        periodStart: "2025-12-15",
        periodEnd: "2026-01-10",
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
        periodStart: "2025-12-20",
        periodEnd: "2026-01-10",
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
        periodStart: "2025-12-20",
        periodEnd: "2026-01-20",
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
        periodStart: "2025-12-01",
        periodEnd: "2025-12-31",
        createdByMembershipId: setup.memberId,
      })
      .expect(201);

    const excludedExpense = await request(app)
      .post(`/api/v1/households/${setup.householdId}/expenses`)
      .send({
        categoryId: setup.categoryId,
        payerMembershipId: setup.adminId,
        actorMembershipId: setup.adminId,
        date: "2025-12-10",
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
        date: "2025-12-11",
        totalAmount: 50000,
        split: { mode: "AUTO_WEIGHTED" },
      })
      .expect(201);
    expect(postCancelExpense.body.split.shares).toHaveLength(2);

    const list = await request(app)
      .get(`/api/v1/households/${setup.householdId}/expenses?from=2025-12-01&to=2025-12-12`)
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
        date: "2025-12-10",
        totalAmount: 100,
        split: { mode: "MANUAL", shares: [{ membershipId: setup.adminId, assignedAmount: 90 }] },
      });
    expect(invalidTotal.status).toBe(400);
    expect(invalidTotal.body.error.code).toBe("INVALID_SHARES_TOTAL");
  });
});

describe("Household chores", () => {
  const inviteMember = async (
    householdId: string,
    adminId: string,
    userId: string,
    livingSince?: string,
  ) => {
    const response = await request(app)
      .post(`/api/v1/households/${householdId}/memberships`)
      .send({
        userId,
        role: "MEMBER",
        invitedByMembershipId: adminId,
        ...(livingSince ? { livingSince } : {}),
      })
      .expect(201);
    return response.body.membershipId as string;
  };

  const createArea = async (householdId: string, adminId: string, name: string) => {
    const response = await request(app)
      .post(`/api/v1/households/${householdId}/common-areas`)
      .send({ name, createdByMembershipId: adminId })
      .expect(201);
    return response.body.commonAreaId as string;
  };

  const createTask = async (
    householdId: string,
    adminId: string,
    commonAreaId: string,
    input: { name: string; priority: number; assigneeLimit: number },
  ) => {
    const response = await request(app)
      .post(`/api/v1/households/${householdId}/chores/tasks`)
      .send({ ...input, commonAreaId, createdByMembershipId: adminId })
      .expect(201);
    return response.body.choreTaskId as string;
  };

  it("allows only ADMIN members to configure common areas and chores", async () => {
    const setup = await bootstrap();
    await request(app)
      .post(`/api/v1/households/${setup.householdId}/common-areas`)
      .send({ name: "Cocina", createdByMembershipId: setup.memberId })
      .expect(403);

    const commonAreaId = await createArea(setup.householdId, setup.adminId, "Cocina");
    await createTask(setup.householdId, setup.adminId, commonAreaId, {
      name: "Limpiar cocina",
      priority: 1,
      assigneeLimit: 2,
    });

    const tasks = await request(app).get(`/api/v1/households/${setup.householdId}/chores/tasks`).expect(200);
    expect(tasks.body.tasks).toHaveLength(1);
    expect(tasks.body.tasks[0].commonArea.name).toBe("Cocina");
  });

  it("prioritizes important chores when members cannot cover every task", async () => {
    const setup = await bootstrap();
    const bathroom = await createArea(setup.householdId, setup.adminId, "Baño");
    const kitchen = await createArea(setup.householdId, setup.adminId, "Cocina");
    const patio = await createArea(setup.householdId, setup.adminId, "Patio");
    await createTask(setup.householdId, setup.adminId, bathroom, {
      name: "Mantener baño",
      priority: 1,
      assigneeLimit: 1,
    });
    await createTask(setup.householdId, setup.adminId, kitchen, {
      name: "Limpiar cocina",
      priority: 2,
      assigneeLimit: 1,
    });
    await createTask(setup.householdId, setup.adminId, patio, {
      name: "Barrer patio",
      priority: 3,
      assigneeLimit: 1,
    });

    const week = await request(app)
      .post(`/api/v1/households/${setup.householdId}/chores/weeks`)
      .send({ weekStart: "2026-01-05", createdByMembershipId: setup.adminId })
      .expect(201);

    expect(week.body.tasks.map((task: { name: string }) => task.name)).toEqual([
      "Mantener baño",
      "Limpiar cocina",
    ]);
  });

  it("uses extra chore capacity and requires every assigned member to mark DONE", async () => {
    const setup = await bootstrap();
    await inviteMember(setup.householdId, setup.adminId, "usr_3");
    await inviteMember(setup.householdId, setup.adminId, "usr_4");
    const bathroom = await createArea(setup.householdId, setup.adminId, "Baño");
    const patio = await createArea(setup.householdId, setup.adminId, "Patio");
    await createTask(setup.householdId, setup.adminId, bathroom, {
      name: "Mantener baño",
      priority: 1,
      assigneeLimit: 3,
    });
    await createTask(setup.householdId, setup.adminId, patio, {
      name: "Barrer patio",
      priority: 2,
      assigneeLimit: 1,
    });

    const week = await request(app)
      .post(`/api/v1/households/${setup.householdId}/chores/weeks`)
      .send({ weekStart: "2026-01-05", createdByMembershipId: setup.adminId })
      .expect(201);
    const bathroomTask = week.body.tasks.find((task: { name: string }) => task.name === "Mantener baño");
    expect(bathroomTask.assignments).toHaveLength(3);

    for (const assignment of bathroomTask.assignments.slice(0, 2) as Array<{
      assignmentId: string;
      membershipId: string;
    }>) {
      await request(app)
        .patch(`/api/v1/households/${setup.householdId}/chores/assignments/${assignment.assignmentId}`)
        .send({ status: "DONE", markedByMembershipId: assignment.membershipId })
        .expect(200);
    }
    const partial = await request(app)
      .get(`/api/v1/households/${setup.householdId}/chores/weeks/2026-01-05`)
      .expect(200);
    expect(
      partial.body.tasks.find((task: { name: string }) => task.name === "Mantener baño").weeklyStatus,
    ).toBe("PENDING");

    const last = bathroomTask.assignments[2] as { assignmentId: string; membershipId: string };
    await request(app)
      .patch(`/api/v1/households/${setup.householdId}/chores/assignments/${last.assignmentId}`)
      .send({ status: "DONE", markedByMembershipId: last.membershipId })
      .expect(200);

    const completed = await request(app)
      .get(`/api/v1/households/${setup.householdId}/chores/weeks/2026-01-05`)
      .expect(200);
    expect(
      completed.body.tasks.find((task: { name: string }) => task.name === "Mantener baño").weeklyStatus,
    ).toBe("DONE");
  });

  it("skips members whose livingSince date is in the future when generating chores", async () => {
    const admin = await registerUser({ name: "Admin", email: "future-chores-admin@mail.com" });
    const created = await request(app)
      .post("/api/v1/households")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Casa Tareas Futuras", currency: "CLP", livingSince: "2025-12-01" })
      .expect(201);
    const futureMemberId = await inviteMember(
      created.body.householdId,
      created.body.creatorMembershipId,
      "usr_3",
      "2026-01-06",
    );
    const kitchen = await createArea(created.body.householdId, created.body.creatorMembershipId, "Cocina");
    await createTask(created.body.householdId, created.body.creatorMembershipId, kitchen, {
      name: "Limpiar cocina",
      priority: 1,
      assigneeLimit: 1,
    });

    const before = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/chores/weeks`)
      .send({ weekStart: "2026-01-05", createdByMembershipId: created.body.creatorMembershipId })
      .expect(201);
    expect(before.body.tasks[0].assignments[0].membershipId).toBe(created.body.creatorMembershipId);

    const after = await request(app)
      .post(`/api/v1/households/${created.body.householdId}/chores/weeks`)
      .send({ weekStart: "2026-01-12", createdByMembershipId: created.body.creatorMembershipId })
      .expect(201);
    expect(after.body.tasks[0].assignments[0].membershipId).toBe(futureMemberId);
  });

  it("generates weeks idempotently and rotates repeated chore assignments", async () => {
    const setup = await bootstrap();
    const bathroom = await createArea(setup.householdId, setup.adminId, "Baño");
    await createTask(setup.householdId, setup.adminId, bathroom, {
      name: "Mantener baño",
      priority: 1,
      assigneeLimit: 1,
    });

    const firstWeek = await request(app)
      .post(`/api/v1/households/${setup.householdId}/chores/weeks`)
      .send({ weekStart: "2026-01-05", createdByMembershipId: setup.adminId })
      .expect(201);
    const secondWeek = await request(app)
      .post(`/api/v1/households/${setup.householdId}/chores/weeks`)
      .send({ weekStart: "2026-01-12", createdByMembershipId: setup.adminId })
      .expect(201);
    const repeatedSecondWeek = await request(app)
      .post(`/api/v1/households/${setup.householdId}/chores/weeks`)
      .send({ weekStart: "2026-01-12", createdByMembershipId: setup.adminId })
      .expect(201);

    const firstMember = firstWeek.body.tasks[0].assignments[0].membershipId;
    const secondMember = secondWeek.body.tasks[0].assignments[0].membershipId;
    expect(secondMember).not.toBe(firstMember);
    expect(repeatedSecondWeek.body.choreWeekId).toBe(secondWeek.body.choreWeekId);
    expect(repeatedSecondWeek.body.tasks[0].assignments).toHaveLength(1);
  });
});
