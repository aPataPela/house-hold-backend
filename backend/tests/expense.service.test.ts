import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ExpenseService } from "../src/context/expenses/services/expense.service";
import { CategoryModel } from "../src/context/households/models/category.model";
import { HouseholdModel } from "../src/context/households/models/household.model";
import { MembershipModel } from "../src/context/households/models/membership.model";
import { PreferenceModel } from "../src/context/participation/models/preference.model";

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" } });
  await mongoose.connect(mongo.getUri(), { dbName: "household_expense_service_test" });
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

describe("ExpenseService", () => {
  it("allows an active actor to register a retroactive expense", async () => {
    const now = () => new Date("2026-02-01T12:00:00.000Z");
    const service = new ExpenseService(now);
    const householdId = "hh_retro";
    const categoryId = "cat_retro";
    const payerMembershipId = "m_payer";
    const actorMembershipId = "m_actor";
    const createdAt = now();

    await HouseholdModel.create({
      _id: householdId,
      id: householdId,
      name: "Casa Retroactiva",
      currency: "CLP",
      approvalMode: "ADMIN_ONLY",
      createdAt,
    });
    await MembershipModel.create([
      {
        _id: payerMembershipId,
        id: payerMembershipId,
        householdId,
        userId: "usr_payer",
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: new Date("2026-01-01T12:00:00.000Z"),
      },
      {
        _id: actorMembershipId,
        id: actorMembershipId,
        householdId,
        userId: "usr_actor",
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    ]);
    await CategoryModel.create({
      _id: categoryId,
      id: categoryId,
      householdId,
      name: "Feria",
      normalizedName: "feria",
      status: "ACTIVE",
      createdAt,
    });

    const expense = await service.register(householdId, {
      categoryId,
      payerMembershipId,
      actorMembershipId,
      date: "2026-01-15",
      totalAmount: 12000,
      split: { mode: "AUTO_WEIGHTED" },
    });

    expect(expense.audit.createdByMembershipId).toBe(actorMembershipId);
    expect(expense.payerMembershipId).toBe(payerMembershipId);
    expect(expense.split.shares).toEqual([
      { membershipId: payerMembershipId, assignedAmount: 12000, weightUsed: 1 },
    ]);
  });

  it("rejects expenses dated in the future", async () => {
    const now = () => new Date("2026-02-01T12:00:00.000Z");
    const service = new ExpenseService(now);
    const householdId = "hh_future";
    const categoryId = "cat_future";
    const membershipId = "m_future";
    const createdAt = now();

    await HouseholdModel.create({
      _id: householdId,
      id: householdId,
      name: "Casa Futuro",
      currency: "CLP",
      approvalMode: "ADMIN_ONLY",
      createdAt,
    });
    await MembershipModel.create({
      _id: membershipId,
      id: membershipId,
      householdId,
      userId: "usr_future",
      role: "MEMBER",
      status: "ACTIVE",
      joinedAt: createdAt,
    });
    await CategoryModel.create({
      _id: categoryId,
      id: categoryId,
      householdId,
      name: "Feria",
      normalizedName: "feria",
      status: "ACTIVE",
      createdAt,
    });

    await expect(
      service.register(householdId, {
        categoryId,
        payerMembershipId: membershipId,
        actorMembershipId: membershipId,
        date: "2026-02-02",
        totalAmount: 12000,
        split: { mode: "AUTO_WEIGHTED" },
      }),
    ).rejects.toMatchObject({
      code: "INVALID_DATE",
    });
  });

  it("resolves participation rules by effective date", async () => {
    const now = () => new Date("2026-02-20T12:00:00.000Z");
    const service = new ExpenseService(now);
    const householdId = "hh_effective";
    const categoryId = "cat_effective";
    const adminId = "m_admin";
    const memberId = "m_member";
    const createdAt = now();

    await HouseholdModel.create({
      _id: householdId,
      id: householdId,
      name: "Casa Efectiva",
      currency: "CLP",
      approvalMode: "ADMIN_ONLY",
      createdAt,
    });
    await MembershipModel.create([
      {
        _id: adminId,
        id: adminId,
        householdId,
        userId: "usr_admin",
        role: "ADMIN",
        status: "ACTIVE",
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        _id: memberId,
        id: memberId,
        householdId,
        userId: "usr_member",
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    await CategoryModel.create({
      _id: categoryId,
      id: categoryId,
      householdId,
      name: "Feria",
      normalizedName: "feria",
      status: "ACTIVE",
      createdAt,
    });
    await PreferenceModel.create({
      _id: "pref_effective",
      id: "pref_effective",
      householdId,
      membershipId: memberId,
      categoryId,
      mode: "HALF",
      weight: 0.5,
      validFrom: new Date("2026-02-10T00:00:00.000Z"),
      validTo: null,
    });

    const beforeChange = await service.register(householdId, {
      categoryId,
      payerMembershipId: adminId,
      actorMembershipId: adminId,
      date: "2026-02-01",
      totalAmount: 12000,
      split: { mode: "AUTO_WEIGHTED" },
    });
    expect(beforeChange.split.shares).toEqual([
      { membershipId: adminId, assignedAmount: 6000, weightUsed: 1 },
      { membershipId: memberId, assignedAmount: 6000, weightUsed: 1 },
    ]);

    const afterChange = await service.register(householdId, {
      categoryId,
      payerMembershipId: adminId,
      actorMembershipId: adminId,
      date: "2026-02-15",
      totalAmount: 12000,
      split: { mode: "AUTO_WEIGHTED" },
    });
    expect(afterChange.split.shares).toEqual([
      { membershipId: adminId, assignedAmount: 8000, weightUsed: 1 },
      { membershipId: memberId, assignedAmount: 4000, weightUsed: 0.5 },
    ]);
  });
});
