import test from "node:test";
import assert from "node:assert/strict";

import { buildHttpRequestHandler } from "../dist/src/infrastructure/http/create-http-server.js";
import { invoke } from "./support/http-invoke.mjs";

const bootstrapExpenseContext = async (handler) => {
  const householdResponse = await invoke(handler, {
    method: "POST",
    url: "/api/v1/households",
    body: {
      name: "Casa C",
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
      name: "Frutos secos",
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
    halfMemberIds,
  };
};

test("Phase C: register AUTO_WEIGHTED expense with items and snapshot shares", async () => {
  const handler = buildHttpRequestHandler();
  const setup = await bootstrapExpenseContext(handler);

  const response = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${setup.householdId}/expenses`,
    body: {
      categoryId: setup.categoryId,
      payerMembershipId: setup.adminMembershipId,
      actorMembershipId: setup.adminMembershipId,
      date: "2026-12-10",
      totalAmount: 47000,
      note: "Compra mensual frutos secos",
      items: [
        { description: "Datiles", quantity: 1, unit: "kg" },
        { description: "Avena integral", quantity: 2, unit: "kg" },
      ],
      split: {
        mode: "AUTO_WEIGHTED",
      },
    },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.totalAmount, 47000);
  assert.equal(response.body.status, "ACTIVE");
  assert.equal(response.body.items.length, 2);
  assert.equal(response.body.split.mode, "AUTO_WEIGHTED");

  const shares = response.body.split.shares;
  assert.equal(shares.length, 8);

  const totalAssigned = shares.reduce((acc, share) => acc + share.assignedAmount, 0);
  assert.equal(totalAssigned, 47000);

  const full = shares
    .filter((share) => share.weightUsed === 1)
    .map((share) => share.assignedAmount)
    .sort((a, b) => b - a);

  const half = shares
    .filter((share) => share.weightUsed === 0.5)
    .map((share) => share.assignedAmount)
    .sort((a, b) => b - a);

  assert.deepEqual(full, [6715, 6715, 6714, 6714, 6714, 6714]);
  assert.deepEqual(half, [3357, 3357]);
});

test("Phase C: reject MANUAL split when shares do not sum total", async () => {
  const handler = buildHttpRequestHandler();
  const setup = await bootstrapExpenseContext(handler);

  const response = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${setup.householdId}/expenses`,
    body: {
      categoryId: setup.categoryId,
      payerMembershipId: setup.adminMembershipId,
      actorMembershipId: setup.adminMembershipId,
      date: "2026-12-10",
      totalAmount: 1000,
      split: {
        mode: "MANUAL",
        shares: [
          { membershipId: setup.membershipIds[0], assignedAmount: 500 },
          { membershipId: setup.membershipIds[1], assignedAmount: 400 },
        ],
      },
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
});
