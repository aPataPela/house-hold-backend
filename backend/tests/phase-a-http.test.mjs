import test from "node:test";
import assert from "node:assert/strict";

import { buildHttpRequestHandler } from "../dist/src/infrastructure/http/create-http-server.js";
import { invoke } from "./support/http-invoke.mjs";

test("Phase A happy path: create household, invite member, create category", async () => {
  const handler = buildHttpRequestHandler();

  const householdResponse = await invoke(handler, {
    method: "POST",
    url: "/api/v1/households",
    body: {
      name: "Casa Nunoa",
      currency: "CLP",
      governanceSettings: {
        categoryParticipationApprovalMode: "ADMIN_ONLY",
      },
      createdByUserId: "usr_1",
    },
  });

  assert.equal(householdResponse.statusCode, 201);
  assert.equal(householdResponse.body.name, "Casa Nunoa");
  assert.equal(householdResponse.body.currency, "CLP");
  assert.equal(
    householdResponse.body.governanceSettings.categoryParticipationApprovalMode,
    "ADMIN_ONLY",
  );
  assert.ok(householdResponse.body.householdId);
  assert.ok(householdResponse.body.creatorMembershipId);

  const householdId = householdResponse.body.householdId;
  const creatorMembershipId = householdResponse.body.creatorMembershipId;

  const inviteResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/memberships`,
    body: {
      userId: "usr_2",
      role: "MEMBER",
      invitedByMembershipId: creatorMembershipId,
    },
  });

  assert.equal(inviteResponse.statusCode, 201);
  assert.equal(inviteResponse.body.householdId, householdId);
  assert.equal(inviteResponse.body.userId, "usr_2");
  assert.equal(inviteResponse.body.role, "MEMBER");
  assert.equal(inviteResponse.body.status, "ACTIVE");

  const createCategoryResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/categories`,
    body: {
      name: "Feria",
      createdByMembershipId: creatorMembershipId,
    },
  });

  assert.equal(createCategoryResponse.statusCode, 201);
  assert.equal(createCategoryResponse.body.householdId, householdId);
  assert.equal(createCategoryResponse.body.name, "Feria");
  assert.equal(createCategoryResponse.body.status, "ACTIVE");

  const duplicatedCategoryResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/categories`,
    body: {
      name: "feria",
      createdByMembershipId: creatorMembershipId,
    },
  });

  assert.equal(duplicatedCategoryResponse.statusCode, 409);
  assert.equal(duplicatedCategoryResponse.body.error.code, "CONFLICT");
});

test("Phase A: only ADMIN can invite members", async () => {
  const handler = buildHttpRequestHandler();

  const householdResponse = await invoke(handler, {
    method: "POST",
    url: "/api/v1/households",
    body: {
      name: "Casa Centro",
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

  const inviteByNonAdminResponse = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/memberships`,
    body: {
      userId: "usr_other",
      role: "MEMBER",
      invitedByMembershipId: memberMembershipId,
    },
  });

  assert.equal(inviteByNonAdminResponse.statusCode, 403);
  assert.equal(inviteByNonAdminResponse.body.error.code, "FORBIDDEN");
});

test("Phase A: avoid duplicated active membership for same user", async () => {
  const handler = buildHttpRequestHandler();

  const householdResponse = await invoke(handler, {
    method: "POST",
    url: "/api/v1/households",
    body: {
      name: "Casa Sur",
      currency: "CLP",
      createdByUserId: "usr_1",
    },
  });

  const householdId = householdResponse.body.householdId;
  const adminMembershipId = householdResponse.body.creatorMembershipId;

  const firstInvite = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/memberships`,
    body: {
      userId: "usr_2",
      role: "MEMBER",
      invitedByMembershipId: adminMembershipId,
    },
  });

  assert.equal(firstInvite.statusCode, 201);

  const secondInvite = await invoke(handler, {
    method: "POST",
    url: `/api/v1/households/${householdId}/memberships`,
    body: {
      userId: "usr_2",
      role: "MEMBER",
      invitedByMembershipId: adminMembershipId,
    },
  });

  assert.equal(secondInvite.statusCode, 409);
  assert.equal(secondInvite.body.error.code, "CONFLICT");
});

test("Phase A: create household validates currency", async () => {
  const handler = buildHttpRequestHandler();

  const response = await invoke(handler, {
    method: "POST",
    url: "/api/v1/households",
    body: {
      name: "Casa Error",
      currency: "USD",
      createdByUserId: "usr_1",
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
});
