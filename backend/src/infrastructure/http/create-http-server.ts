import { createServer } from "node:http";

import { ValidationError } from "../../application/errors.js";
import { CreateCategoryUseCase } from "../../application/use-cases/create-category.use-case.js";
import { CreateHouseholdUseCase } from "../../application/use-cases/create-household.use-case.js";
import { InviteMemberUseCase } from "../../application/use-cases/invite-member.use-case.js";
import { mapErrorToHttp } from "./error-mapper.js";
import { MethodNotAllowedError, RouteNotFoundError } from "./http-error.js";
import { sendJson } from "./json-response.js";
import {
  createInMemoryAppContext,
  type InMemoryAppContext,
} from "../persistence/in-memory/create-in-memory-app-context.js";
import { SystemClock } from "../system/system-clock.js";
import { SequentialIdGenerator } from "../system/sequential-id-generator.js";

const API_BASE_PATH = "/api/v1";

interface HttpRoute {
  method: string;
  pathPattern: string;
  handler: (ctx: {
    req: any;
    res: any;
    path: string;
    params: Record<string, string>;
    url: URL;
    appContext: InMemoryAppContext;
    clock: SystemClock;
    idGenerator: SequentialIdGenerator;
  }) => Promise<void> | void;
}

export interface HttpServerDependencies {
  appContext?: InMemoryAppContext;
  clock?: SystemClock;
  idGenerator?: SequentialIdGenerator;
}

export const buildHttpRequestHandler = (deps: HttpServerDependencies = {}) => {
  const appContext = deps.appContext ?? createInMemoryAppContext();
  const clock = deps.clock ?? new SystemClock();
  const idGenerator = deps.idGenerator ?? new SequentialIdGenerator();

  const createHouseholdUseCase = new CreateHouseholdUseCase({
    householdRepository: appContext.repositories.householdRepository,
    membershipRepository: appContext.repositories.membershipRepository,
    idGenerator,
    clock,
  });

  const inviteMemberUseCase = new InviteMemberUseCase({
    householdRepository: appContext.repositories.householdRepository,
    membershipRepository: appContext.repositories.membershipRepository,
    idGenerator,
    clock,
  });

  const createCategoryUseCase = new CreateCategoryUseCase({
    householdRepository: appContext.repositories.householdRepository,
    membershipRepository: appContext.repositories.membershipRepository,
    categoryRepository: appContext.repositories.categoryRepository,
    idGenerator,
    clock,
  });

  const routes: HttpRoute[] = [
    {
      method: "GET",
      pathPattern: "/health",
      handler: ({ res }) => {
        sendJson(res, 200, {
          status: "ok",
          service: "shared-household-expenses-backend",
        });
      },
    },
    {
      method: "GET",
      pathPattern: API_BASE_PATH,
      handler: ({ res }) => {
        sendJson(res, 200, {
          name: "Shared Household Expenses API",
          version: "v1",
          status: "ok",
        });
      },
    },
    {
      method: "GET",
      pathPattern: `${API_BASE_PATH}/health`,
      handler: ({ res }) => {
        sendJson(res, 200, {
          status: "ok",
          basePath: API_BASE_PATH,
          serverTime: clock.now().toISOString(),
        });
      },
    },
    {
      method: "POST",
      pathPattern: `${API_BASE_PATH}/households`,
      handler: async ({ req, res }) => {
        const body = asObject(await readJsonBody(req));
        const governanceSettings = asOptionalGovernanceSettings(body.governanceSettings);

        const result = await createHouseholdUseCase.execute({
          name: asRequiredString(body.name, "name"),
          currency: asRequiredCurrency(body.currency),
          createdByUserId: asRequiredString(body.createdByUserId, "createdByUserId"),
          ...(governanceSettings ? { governanceSettings } : {}),
        });

        sendJson(res, 201, {
          householdId: result.household.id,
          name: result.household.name,
          currency: result.household.currency,
          governanceSettings: result.household.governanceSettings,
          createdAt: result.household.createdAt.toISOString(),
          creatorMembershipId: result.creatorMembership.id,
        });
      },
    },
    {
      method: "POST",
      pathPattern: `${API_BASE_PATH}/households/:householdId/memberships`,
      handler: async ({ req, res, params }) => {
        const body = asObject(await readJsonBody(req));

        const result = await inviteMemberUseCase.execute({
          householdId: asRequiredString(params.householdId, "householdId"),
          userId: asRequiredString(body.userId, "userId"),
          role: asRequiredRole(body.role),
          invitedByMembershipId: asRequiredString(body.invitedByMembershipId, "invitedByMembershipId"),
        });

        sendJson(res, 201, {
          membershipId: result.membership.id,
          householdId: result.membership.householdId,
          userId: result.membership.userId,
          role: result.membership.role,
          status: result.membership.status,
          joinedAt: result.membership.joinedAt.toISOString(),
        });
      },
    },
    {
      method: "POST",
      pathPattern: `${API_BASE_PATH}/households/:householdId/categories`,
      handler: async ({ req, res, params }) => {
        const body = asObject(await readJsonBody(req));

        const result = await createCategoryUseCase.execute({
          householdId: asRequiredString(params.householdId, "householdId"),
          name: asRequiredString(body.name, "name"),
          createdByMembershipId: asRequiredString(body.createdByMembershipId, "createdByMembershipId"),
        });

        sendJson(res, 201, {
          categoryId: result.category.id,
          householdId: result.category.householdId,
          name: result.category.name,
          createdAt: result.category.createdAt.toISOString(),
          status: result.category.status,
        });
      },
    },
  ];

  return async (req: any, res: any): Promise<void> => {
    try {
      const method = (req.method ?? "GET").toUpperCase();
      const url = new URL(req.url ?? "/", "http://localhost");
      const path = normalizePath(url.pathname);

      const pathMatches = routes
        .map((route) => ({
          route,
          match: matchPath(route.pathPattern, path),
        }))
        .filter((candidate) => candidate.match.matched);

      if (pathMatches.length === 0) {
        throw new RouteNotFoundError(path);
      }

      const resolved = pathMatches.find((candidate) => candidate.route.method === method);
      if (!resolved) {
        throw new MethodNotAllowedError(method, path);
      }

      await resolved.route.handler({
        req,
        res,
        path,
        params: resolved.match.params,
        url,
        appContext,
        clock,
        idGenerator,
      });
    } catch (error) {
      const mapped = mapErrorToHttp(error);
      if (mapped.statusCode >= 500) {
        console.error("[http] internal error", error);
      }
      sendJson(res, mapped.statusCode, mapped.body);
    }
  };
};

export const createHttpServer = (deps: HttpServerDependencies = {}) => {
  const handler = buildHttpRequestHandler(deps);
  return createServer(handler);
};

const normalizePath = (path: string): string => {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
};

const matchPath = (
  pathPattern: string,
  path: string,
): { matched: boolean; params: Record<string, string> } => {
  const patternSegments = pathPattern.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i += 1) {
    const pattern = patternSegments[i];
    const segment = pathSegments[i];

    if (!pattern || !segment) {
      return { matched: false, params: {} };
    }

    if (pattern.startsWith(":")) {
      params[pattern.slice(1)] = decodeURIComponent(segment);
      continue;
    }

    if (pattern !== segment) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
};

const readJsonBody = async (req: any): Promise<unknown> => {
  if (req.body !== undefined) {
    return req.body;
  }

  const method = (req.method ?? "GET").toUpperCase();
  if (["GET", "HEAD"].includes(method)) {
    return {};
  }

  const raw = await readRawBody(req);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError("invalid JSON body");
  }
};

const readRawBody = async (req: any): Promise<string> => {
  if (typeof req.on !== "function") {
    return "";
  }

  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk: unknown) => {
      raw += toUtf8String(chunk);
    });

    req.on("end", () => {
      resolve(raw);
    });

    req.on("error", (error: unknown) => {
      reject(error);
    });
  });
};

const toUtf8String = (chunk: unknown): string => {
  if (typeof chunk === "string") {
    return chunk;
  }

  if (typeof chunk === "object" && chunk && "toString" in chunk) {
    return String((chunk as { toString: (encoding?: string) => string }).toString("utf8"));
  }

  return String(chunk);
};

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("body must be a JSON object");
  }

  return value as Record<string, unknown>;
};

const asRequiredString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }

  return value.trim();
};

const asRequiredCurrency = (value: unknown): "CLP" => {
  if (value !== "CLP") {
    throw new ValidationError("currency must be CLP");
  }

  return "CLP";
};

const asRequiredRole = (value: unknown): "ADMIN" | "MEMBER" => {
  if (value !== "ADMIN" && value !== "MEMBER") {
    throw new ValidationError("role must be ADMIN or MEMBER");
  }

  return value;
};

const asOptionalGovernanceSettings = (
  value: unknown,
):
  | {
      categoryParticipationApprovalMode: "ADMIN_ONLY";
    }
  | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("governanceSettings must be an object");
  }

  const mode = (value as Record<string, unknown>).categoryParticipationApprovalMode;
  if (mode !== "ADMIN_ONLY") {
    throw new ValidationError("governanceSettings.categoryParticipationApprovalMode must be ADMIN_ONLY");
  }

  return {
    categoryParticipationApprovalMode: "ADMIN_ONLY",
  };
};
