import test from "node:test";
import assert from "node:assert/strict";

import { buildHttpRequestHandler } from "../dist/src/infrastructure/http/create-http-server.js";

const invoke = async (handler, req) => {
  let responseBody = "";
  const headers = new Map();
  const res = {
    statusCode: 200,
    setHeader: (name, value) => {
      headers.set(name.toLowerCase(), value);
    },
    end: (body) => {
      responseBody = body ?? "";
    },
  };

  await handler(req, res);

  return {
    statusCode: res.statusCode,
    headers,
    body: responseBody ? JSON.parse(responseBody) : {},
  };
};

test("HTTP smoke: healthcheck, base router, error mapping", async () => {
  const handler = buildHttpRequestHandler();

  const health = await invoke(handler, {
    method: "GET",
    url: "/health",
  });
  assert.equal(health.statusCode, 200);
  assert.equal(health.body.status, "ok");
  assert.equal(health.body.service, "shared-household-expenses-backend");

  const apiBase = await invoke(handler, {
    method: "GET",
    url: "/api/v1",
  });
  assert.equal(apiBase.statusCode, 200);
  assert.equal(apiBase.body.version, "v1");

  const notFound = await invoke(handler, {
    method: "GET",
    url: "/api/v1/not-found",
  });
  assert.equal(notFound.statusCode, 404);
  assert.equal(notFound.body.error.code, "ROUTE_NOT_FOUND");

  const methodNotAllowed = await invoke(handler, {
    method: "POST",
    url: "/api/v1/health",
  });
  assert.equal(methodNotAllowed.statusCode, 405);
  assert.equal(methodNotAllowed.body.error.code, "METHOD_NOT_ALLOWED");
});
