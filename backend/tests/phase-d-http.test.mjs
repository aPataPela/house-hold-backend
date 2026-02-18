import test from "node:test";
import assert from "node:assert/strict";

import { buildHttpRequestHandler } from "../dist/src/infrastructure/http/create-http-server.js";
import { invoke } from "./support/http-invoke.mjs";

const bootstrapExpenseContext = async (handler) => {
  const householdResponse = await invoke(handler, {
    method: "POST",
    url: "/api/v1/households",
    body: {
      name: "Casa D",
      currency: "CLP",
      createdByUserId: "usr_admin",
    },
  });

  const householdId = householdResponse.body.householdId;
  const adminMembershipId = householdResponse.body.creatorMembershipId;
  const membershipIds = [adminMembershipId];

  for (let i = 2; i <= 8; i += 1) {
    const memberResponse = await invoke(handler, {
      method: "POST",
      url: `/api/v1/households/${householdId}/memberships`,
      body: {
        userId: `usr_${i}`,
        role: "MEMBER",
        invitedByMembershipId: adminMembershipId,
      },
    });

    membershipIds.push(memberResponse.body.membershipId);
  }

  const categoryResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/categories`,
    body: {
      name: "Feria",
      createdByMembershipId: adminMembershipId,
    },
  });

  const categoryId = categoryResponse.body.categoryId;
  const halfMemberIds = membershipIds.slice(-2);

  for (const memberId of halfMemberIds) {
    const preferenceResponse = await invoke(handler, {
      method: "PUT",
      url: `/api/v1/households/${householdId}/categories/${categoryId}/preferences/${memberId}`,
      body: {
        mode: "INCLUDE_DEFAULT",
        weight: 0.5,
        validFrom: "2026-01-01",
        validTo: null,
        changedByMembershipId: adminMembershipId,
      },
    });

    assert.equal(preferenceResponse.statusCode, 200);
  }

  return {
    householdId,
    categoryId,
    adminMembershipId,
    membershipIds,
  };
};

const registerAutoExpense = async (
  handler,
  { householdId, categoryId, payerMembershipId, actorMembershipId, date, totalAmount, note },
) =>
  invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/expenses`,
    body: {
      categoryId,
      payerMembershipId,
      actorMembershipId,
      date,
      totalAmount,
      ...(note ? { note } : {}),
      split: { mode: "AUTO_WEIGHTED" },
    },
  });

test("Phase D: list expenses by period with stable cursor pagination", async () => {
  const handler = buildHttpRequestHandler();
  const setup = await bootstrapExpenseContext(handler);

  const expenseOne = await registerAutoExpense(handler, {
    householdId: setup.householdId,
    categoryId: setup.categoryId,
    payerMembershipId: setup.membershipIds[0],
    actorMembershipId: setup.adminMembershipId,
    date: "2026-03-10",
    totalAmount: 47000,
    note: "Frutos secos",
  });

  const expenseTwo = await registerAutoExpense(handler, {
    householdId: setup.householdId,
    categoryId: setup.categoryId,
    payerMembershipId: setup.membershipIds[1],
    actorMembershipId: setup.adminMembershipId,
    date: "2026-03-15",
    totalAmount: 50000,
    note: "Feria semana 2",
  });

  const outOfPeriod = await registerAutoExpense(handler, {
    householdId: setup.householdId,
    categoryId: setup.categoryId,
    payerMembershipId: setup.membershipIds[2],
    actorMembershipId: setup.adminMembershipId,
    date: "2026-04-05",
    totalAmount: 12000,
    note: "Fuera de periodo",
  });

  assert.equal(expenseOne.statusCode, 201);
  assert.equal(expenseTwo.statusCode, 201);
  assert.equal(outOfPeriod.statusCode, 201);

  const pageOne = await invoke(handler, {
    method: "GET",
    url: `/api/v1/households/${setup.householdId}/expenses?from=2026-03-01&to=2026-04-01&limit=1`,
  });

  assert.equal(pageOne.statusCode, 200);
  assert.equal(pageOne.body.expenses.length, 1);
  assert.equal(pageOne.body.expenses[0].expenseId, expenseTwo.body.expenseId);
  assert.equal(pageOne.body.page.limit, 1);
  assert.equal(pageOne.body.page.nextCursor, expenseTwo.body.expenseId);

  const pageTwo = await invoke(handler, {
    method: "GET",
    url: `/api/v1/households/${setup.householdId}/expenses?from=2026-03-01&to=2026-04-01&limit=1&cursor=${pageOne.body.page.nextCursor}`,
  });

  assert.equal(pageTwo.statusCode, 200);
  assert.equal(pageTwo.body.expenses.length, 1);
  assert.equal(pageTwo.body.expenses[0].expenseId, expenseOne.body.expenseId);
  assert.equal(pageTwo.body.page.limit, 1);

  const pageThree = await invoke(handler, {
    method: "GET",
    url: `/api/v1/households/${setup.householdId}/expenses?from=2026-03-01&to=2026-04-01&limit=1&cursor=${pageTwo.body.page.nextCursor}`,
  });

  assert.equal(pageThree.statusCode, 200);
  assert.equal(pageThree.body.expenses.length, 0);
  assert.deepEqual(pageThree.body.page, { limit: 1 });
});

test("Phase D: get household balance aggregates paid and assigned by member", async () => {
  const handler = buildHttpRequestHandler();
  const setup = await bootstrapExpenseContext(handler);

  const expenseOne = await registerAutoExpense(handler, {
    householdId: setup.householdId,
    categoryId: setup.categoryId,
    payerMembershipId: setup.membershipIds[0],
    actorMembershipId: setup.adminMembershipId,
    date: "2026-03-10",
    totalAmount: 47000,
  });

  const expenseTwo = await registerAutoExpense(handler, {
    householdId: setup.householdId,
    categoryId: setup.categoryId,
    payerMembershipId: setup.membershipIds[1],
    actorMembershipId: setup.adminMembershipId,
    date: "2026-03-15",
    totalAmount: 50000,
  });

  assert.equal(expenseOne.statusCode, 201);
  assert.equal(expenseTwo.statusCode, 201);

  const balanceResponse = await invoke(handler, {
    method: "GET",
    url: `/api/v1/households/${setup.householdId}/balance?from=2026-03-01&to=2026-04-01`,
  });

  assert.equal(balanceResponse.statusCode, 200);
  assert.equal(balanceResponse.body.householdId, setup.householdId);
  assert.equal(balanceResponse.body.members.length, 8);

  const expected = new Map(
    setup.membershipIds.map((membershipId) => [
      membershipId,
      {
        paid: 0,
        assigned: 0,
      },
    ]),
  );

  for (const share of expenseOne.body.split.shares) {
    expected.get(share.membershipId).assigned += share.assignedAmount;
  }
  for (const share of expenseTwo.body.split.shares) {
    expected.get(share.membershipId).assigned += share.assignedAmount;
  }

  expected.get(expenseOne.body.payerMembershipId).paid += expenseOne.body.totalAmount;
  expected.get(expenseTwo.body.payerMembershipId).paid += expenseTwo.body.totalAmount;

  const totalNet = balanceResponse.body.members.reduce((acc, row) => acc + row.netBalance, 0);
  assert.equal(totalNet, 0);

  for (const row of balanceResponse.body.members) {
    const expectedRow = expected.get(row.membershipId);
    assert.ok(expectedRow);
    assert.equal(row.paid, expectedRow.paid);
    assert.equal(row.assigned, expectedRow.assigned);
    assert.equal(row.netBalance, expectedRow.paid - expectedRow.assigned);
  }
});
