import test from "node:test";
import assert from "node:assert/strict";

import { RegisterExpenseUseCase } from "../dist/src/application/use-cases/register-expense.use-case.js";
import { WeightedSplitCalculator } from "../dist/src/domain/services/weighted-split-calculator.js";

class InMemoryHouseholdRepository {
  constructor(households) {
    this.households = households;
  }

  async findById(householdId) {
    return this.households.find((household) => household.id === householdId) ?? null;
  }
}

class InMemoryCategoryRepository {
  constructor(categories) {
    this.categories = categories;
  }

  async findById(categoryId) {
    return this.categories.find((category) => category.id === categoryId) ?? null;
  }
}

class InMemoryMembershipRepository {
  constructor(memberships) {
    this.memberships = memberships;
  }

  async findById(membershipId) {
    return this.memberships.find((membership) => membership.id === membershipId) ?? null;
  }

  async listActiveByHouseholdOnDate(householdId) {
    return this.memberships.filter(
      (membership) => membership.householdId === householdId && membership.status === "ACTIVE",
    );
  }
}

class InMemoryPreferenceRepository {
  constructor(preferences) {
    this.preferences = preferences;
  }

  async listByHouseholdCategoryOnDate(householdId, categoryId) {
    return this.preferences.filter(
      (preference) => preference.householdId === householdId && preference.categoryId === categoryId,
    );
  }
}

class InMemoryParticipationRequestRepository {
  constructor(requests) {
    this.requests = requests;
  }

  async listApprovedTemporaryExclusionsOnDate(householdId, categoryId) {
    return this.requests.filter(
      (request) =>
        request.householdId === householdId &&
        request.categoryId === categoryId &&
        request.status === "APPROVED",
    );
  }
}

class InMemoryExpenseRepository {
  constructor() {
    this.records = [];
  }

  async save(expense) {
    this.records.push(expense);
  }

  async listByHouseholdAndPeriod() {
    return this.records;
  }
}

class FixedClock {
  now() {
    return new Date("2026-02-18T12:00:00.000Z");
  }
}

class SequenceIdGenerator {
  constructor() {
    this.seq = 0;
  }

  next(prefix) {
    this.seq += 1;
    return `${prefix}_${this.seq}`;
  }
}

const buildFixture = () => {
  const household = {
    id: "hh_1",
    name: "Casa Compartida",
    currency: "CLP",
    governanceSettings: {
      categoryParticipationApprovalMode: "ADMIN_ONLY",
    },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const category = {
    id: "cat_1",
    householdId: household.id,
    name: "Feria",
    status: "ACTIVE",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
  };

  const memberships = Array.from({ length: 8 }, (_, index) => ({
    id: `m${index + 1}`,
    householdId: household.id,
    userId: `u${index + 1}`,
    role: index === 0 ? "ADMIN" : "MEMBER",
    status: "ACTIVE",
    joinedAt: new Date("2026-01-01T00:00:00.000Z"),
    leftAt: null,
  }));

  const preferences = [
    {
      id: "pref_m7",
      householdId: household.id,
      membershipId: "m7",
      categoryId: category.id,
      mode: "INCLUDE_DEFAULT",
      weight: 0.5,
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      validTo: null,
    },
    {
      id: "pref_m8",
      householdId: household.id,
      membershipId: "m8",
      categoryId: category.id,
      mode: "INCLUDE_DEFAULT",
      weight: 0.5,
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      validTo: null,
    },
  ];

  const expenseRepository = new InMemoryExpenseRepository();

  const useCase = new RegisterExpenseUseCase({
    householdRepository: new InMemoryHouseholdRepository([household]),
    membershipRepository: new InMemoryMembershipRepository(memberships),
    categoryRepository: new InMemoryCategoryRepository([category]),
    memberCategoryPreferenceRepository: new InMemoryPreferenceRepository(preferences),
    participationChangeRequestRepository: new InMemoryParticipationRequestRepository([]),
    expenseRepository,
    weightedSplitCalculator: new WeightedSplitCalculator(),
    idGenerator: new SequenceIdGenerator(),
    clock: new FixedClock(),
  });

  return {
    useCase,
    expenseRepository,
  };
};

test("RegisterExpense registra gasto AUTO_WEIGHTED con snapshot y items", async () => {
  const fixture = buildFixture();

  const result = await fixture.useCase.execute({
    householdId: "hh_1",
    categoryId: "cat_1",
    payerMembershipId: "m1",
    actorMembershipId: "m1",
    date: "2026-02-10",
    totalAmount: 47000,
    note: "Frutos secos",
    items: [
      { description: "Dátiles", quantity: 1, unit: "kg" },
      { description: "Avena integral", quantity: 2, unit: "kg" },
    ],
    split: {
      mode: "AUTO_WEIGHTED",
    },
  });

  const totalAssigned = result.expense.split.shares.reduce(
    (acc, share) => acc + share.assignedAmount,
    0,
  );

  assert.equal(result.expense.id, "exp_1");
  assert.equal(result.expense.totalAmount, 47000);
  assert.equal(result.expense.status, "ACTIVE");
  assert.equal(result.expense.items.length, 2);
  assert.equal(totalAssigned, 47000);
  assert.equal(fixture.expenseRepository.records.length, 1);
});

test("RegisterExpense soporta caso real 50.000 CLP con suma exacta", async () => {
  const fixture = buildFixture();

  const result = await fixture.useCase.execute({
    householdId: "hh_1",
    categoryId: "cat_1",
    payerMembershipId: "m2",
    actorMembershipId: "m2",
    date: "2026-02-15",
    totalAmount: 50000,
    items: [{ description: "Tomate pomarola", quantity: 2, unit: "kg" }],
    split: {
      mode: "AUTO_WEIGHTED",
    },
  });

  const totalAssigned = result.expense.split.shares.reduce(
    (acc, share) => acc + share.assignedAmount,
    0,
  );

  assert.equal(totalAssigned, 50000);

  const full = result.expense.split.shares
    .filter((share) => share.weightUsed === 1)
    .map((share) => share.assignedAmount)
    .sort((a, b) => b - a);

  const half = result.expense.split.shares
    .filter((share) => share.weightUsed === 0.5)
    .map((share) => share.assignedAmount)
    .sort((a, b) => b - a);

  assert.deepEqual(full, [7143, 7143, 7143, 7143, 7143, 7143]);
  assert.deepEqual(half, [3571, 3571]);
});
