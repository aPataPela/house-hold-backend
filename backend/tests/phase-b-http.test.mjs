import test from "node:test";
import assert from "node:assert/strict";

import { buildHttpRequestHandler } from "../dist/src/infrastructure/http/create-http-server.js";
import { invoke } from "./support/http-invoke.mjs";

const bootstrapHousehold = async (handler) => {
  const householdResponse = await invoke(handler, {
    method: "POST",
    url: "/api/v1/households",
    body: {
      name: "Casa B",
      currency: "CLP",
      createdByUserId: "usr_admin",
    },
  });

  const householdId = householdResponse.body.householdId;
  const adminMembershipId = householdResponse.body.creatorMembershipId;

  const memberResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/memberships`,
    body: {
      userId: "usr_member",
      role: "MEMBER",
      invitedByMembershipId: adminMembershipId,
    },
  });

  const memberMembershipId = memberResponse.body.membershipId;

  const categoryResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/categories`,
    body: {
      name: "Feria",
      createdByMembershipId: adminMembershipId,
    },
  });

  return {
    householdId,
    adminMembershipId,
    memberMembershipId,
    categoryId: categoryResponse.body.categoryId,
  };
};

test("Phase B happy path: set preference, request exclusion and approve", async () => {
  const handler = buildHttpRequestHandler();
  const setup = await bootstrapHousehold(handler);

  const setPreferenceResponse = await invoke(handler, {
    method: "PUT",
    url: `/api/v1/households/${setup.householdId}/categories/${setup.categoryId}/preferences/${setup.memberMembershipId}`,
    body: {
      mode: "INCLUDE_DEFAULT",
      weight: 0.5,
      validFrom: "2026-02-01",
      validTo: null,
      changedByMembershipId: setup.adminMembershipId,
    },
  });

  assert.equal(setPreferenceResponse.statusCode, 200);
  assert.equal(setPreferenceResponse.body.mode, "INCLUDE_DEFAULT");
  assert.equal(setPreferenceResponse.body.weight, 0.5);

  const overlappedPreferenceResponse = await invoke(handler, {
    method: "PUT",
    url: `/api/v1/households/${setup.householdId}/categories/${setup.categoryId}/preferences/${setup.memberMembershipId}`,
    body: {
      mode: "EXCLUDE_DEFAULT",
      validFrom: "2026-03-01",
      validTo: null,
      changedByMembershipId: setup.adminMembershipId,
    },
  });

  assert.equal(overlappedPreferenceResponse.statusCode, 400);
  assert.equal(overlappedPreferenceResponse.body.error.code, "VALIDATION_ERROR");

  const requestResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${setup.householdId}/category-participation-requests`,
    body: {
      membershipId: setup.memberMembershipId,
      categoryId: setup.categoryId,
      requestType: "TEMPORARY_EXCLUDE",
      periodStart: "2026-03-01",
      periodEnd: "2026-03-20",
      reason: "Viaje",
    },
  });

  assert.equal(requestResponse.statusCode, 201);
  assert.equal(requestResponse.body.status, "PENDING");

  const decisionResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${setup.householdId}/category-participation-requests/${requestResponse.body.requestId}/decision`,
    body: {
      decision: "APPROVED",
      decidedByMembershipId: setup.adminMembershipId,
      comment: "ok",
    },
  });

  assert.equal(decisionResponse.statusCode, 200);
  assert.equal(decisionResponse.body.status, "APPROVED");
  assert.equal(decisionResponse.body.decision.decidedByMembershipId, setup.adminMembershipId);

  const repeatedDecisionResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${setup.householdId}/category-participation-requests/${requestResponse.body.requestId}/decision`,
    body: {
      decision: "REJECTED",
      decidedByMembershipId: setup.adminMembershipId,
    },
  });

  assert.equal(repeatedDecisionResponse.statusCode, 409);
  assert.equal(repeatedDecisionResponse.body.error.code, "CONFLICT");
});

test("Phase B: only ADMIN can approve request", async () => {
  const handler = buildHttpRequestHandler();
  const setup = await bootstrapHousehold(handler);

  const requestResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${setup.householdId}/category-participation-requests`,
    body: {
      membershipId: setup.memberMembershipId,
      categoryId: setup.categoryId,
      requestType: "TEMPORARY_EXCLUDE",
      periodStart: "2026-03-01",
      periodEnd: "2026-03-20",
      reason: "Viaje",
    },
  });

  const decisionResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${setup.householdId}/category-participation-requests/${requestResponse.body.requestId}/decision`,
    body: {
      decision: "APPROVED",
      decidedByMembershipId: setup.memberMembershipId,
    },
  });

  assert.equal(decisionResponse.statusCode, 403);
  assert.equal(decisionResponse.body.error.code, "FORBIDDEN");
});

test("Phase B: only ADMIN can modify preference of another member", async () => {
  const handler = buildHttpRequestHandler();
  const setup = await bootstrapHousehold(handler);

  const response = await invoke(handler, {
    method: "PUT",
    url: `/api/v1/households/${setup.householdId}/categories/${setup.categoryId}/preferences/${setup.adminMembershipId}`,
    body: {
      mode: "INCLUDE_DEFAULT",
      weight: 1,
      validFrom: "2026-02-01",
      validTo: null,
      changedByMembershipId: setup.memberMembershipId,
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "FORBIDDEN");
});

test("Phase B: request type must be TEMPORARY_EXCLUDE", async () => {
  const handler = buildHttpRequestHandler();
  const setup = await bootstrapHousehold(handler);

  const response = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${setup.householdId}/category-participation-requests`,
    body: {
      membershipId: setup.memberMembershipId,
      categoryId: setup.categoryId,
      requestType: "PERMANENT_EXCLUDE",
      periodStart: "2026-03-01",
      periodEnd: "2026-03-20",
      reason: "Viaje",
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
});
