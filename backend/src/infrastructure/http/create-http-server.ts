import { createServer } from "node:http";

import { ValidationError } from "../../application/errors.js";
import { ApproveRequestUseCase } from "../../application/use-cases/approve-request.use-case.js";
import { CreateCategoryUseCase } from "../../application/use-cases/create-category.use-case.js";
import { CreateHouseholdUseCase } from "../../application/use-cases/create-household.use-case.js";
import { InviteMemberUseCase } from "../../application/use-cases/invite-member.use-case.js";
import {
  RegisterExpenseUseCase,
  type RegisterExpenseItemInput,
  type RegisterExpenseSplitInput,
} from "../../application/use-cases/register-expense.use-case.js";
import { RequestTemporaryExclusionUseCase } from "../../application/use-cases/request-temporary-exclusion.use-case.js";
import { SetMemberCategoryPreferenceUseCase } from "../../application/use-cases/set-member-category-preference.use-case.js";
import { WeightedSplitCalculator } from "../../domain/services/weighted-split-calculator.js";
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

  const setMemberCategoryPreferenceUseCase = new SetMemberCategoryPreferenceUseCase({
    householdRepository: appContext.repositories.householdRepository,
    membershipRepository: appContext.repositories.membershipRepository,
    categoryRepository: appContext.repositories.categoryRepository,
    memberCategoryPreferenceRepository: appContext.repositories.memberCategoryPreferenceRepository,
    idGenerator,
    clock,
  });

  const requestTemporaryExclusionUseCase = new RequestTemporaryExclusionUseCase({
    householdRepository: appContext.repositories.householdRepository,
    membershipRepository: appContext.repositories.membershipRepository,
    categoryRepository: appContext.repositories.categoryRepository,
    categoryParticipationChangeRequestRepository:
      appContext.repositories.participationChangeRequestRepository,
    idGenerator,
    clock,
  });

  const approveRequestUseCase = new ApproveRequestUseCase({
    householdRepository: appContext.repositories.householdRepository,
    membershipRepository: appContext.repositories.membershipRepository,
    categoryParticipationChangeRequestRepository:
      appContext.repositories.participationChangeRequestRepository,
    clock,
  });

  const registerExpenseUseCase = new RegisterExpenseUseCase({
    householdRepository: appContext.repositories.householdRepository,
    membershipRepository: appContext.repositories.membershipRepository,
    categoryRepository: appContext.repositories.categoryRepository,
    memberCategoryPreferenceRepository: appContext.repositories.memberCategoryPreferenceRepository,
    participationChangeRequestRepository: appContext.repositories.participationChangeRequestRepository,
    expenseRepository: appContext.repositories.expenseRepository,
    weightedSplitCalculator: new WeightedSplitCalculator(),
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

    {
      method: "PUT",
      pathPattern: `${API_BASE_PATH}/households/:householdId/categories/:categoryId/preferences/:membershipId`,
      handler: async ({ req, res, params }) => {
        const body = asObject(await readJsonBody(req));
        const validTo = asOptionalNullableString(body.validTo, "validTo");
        const weight = asOptionalNumber(body.weight, "weight");

        const result = await setMemberCategoryPreferenceUseCase.execute({
          householdId: asRequiredString(params.householdId, "householdId"),
          membershipId: asRequiredString(params.membershipId, "membershipId"),
          categoryId: asRequiredString(params.categoryId, "categoryId"),
          mode: asRequiredPreferenceMode(body.mode),
          validFrom: asRequiredString(body.validFrom, "validFrom"),
          changedByMembershipId: asRequiredString(body.changedByMembershipId, "changedByMembershipId"),
          ...(weight !== undefined ? { weight } : {}),
          ...(validTo !== undefined ? { validTo } : {}),
        });

        sendJson(res, 200, {
          preferenceId: result.preference.id,
          membershipId: result.preference.membershipId,
          categoryId: result.preference.categoryId,
          mode: result.preference.mode,
          weight: result.preference.weight,
          validFrom: result.preference.validFrom.toISOString(),
          validTo: result.preference.validTo ? result.preference.validTo.toISOString() : null,
        });
      },
    },
    {
      method: "POST",
      pathPattern: `${API_BASE_PATH}/households/:householdId/category-participation-requests`,
      handler: async ({ req, res, params }) => {
        const body = asObject(await readJsonBody(req));
        asRequiredRequestType(body.requestType);

        const result = await requestTemporaryExclusionUseCase.execute({
          householdId: asRequiredString(params.householdId, "householdId"),
          membershipId: asRequiredString(body.membershipId, "membershipId"),
          categoryId: asRequiredString(body.categoryId, "categoryId"),
          periodStart: asRequiredString(body.periodStart, "periodStart"),
          periodEnd: asRequiredString(body.periodEnd, "periodEnd"),
          reason: asRequiredString(body.reason, "reason"),
        });

        sendJson(res, 201, {
          requestId: result.request.id,
          status: result.request.status,
          createdAt: result.request.createdAt.toISOString(),
        });
      },
    },
    {
      method: "POST",
      pathPattern: `${API_BASE_PATH}/households/:householdId/category-participation-requests/:requestId/decision`,
      handler: async ({ req, res, params }) => {
        const body = asObject(await readJsonBody(req));
        const comment = asOptionalString(body.comment, "comment");

        const result = await approveRequestUseCase.execute({
          householdId: asRequiredString(params.householdId, "householdId"),
          requestId: asRequiredString(params.requestId, "requestId"),
          decision: asRequiredDecision(body.decision),
          decidedByMembershipId: asRequiredString(body.decidedByMembershipId, "decidedByMembershipId"),
          ...(comment ? { comment } : {}),
        });

        sendJson(res, 200, {
          requestId: result.request.id,
          status: result.request.status,
          decision: result.request.decision
            ? {
                decidedByMembershipId: result.request.decision.decidedByMembershipId,
                decidedAt: result.request.decision.decidedAt.toISOString(),
                ...(result.request.decision.comment
                  ? { comment: result.request.decision.comment }
                  : {}),
              }
            : null,
        });
      },
    },
    {
      method: "POST",
      pathPattern: `${API_BASE_PATH}/households/:householdId/expenses`,
      handler: async ({ req, res, params }) => {
        const body = asObject(await readJsonBody(req));
        const note = asOptionalString(body.note, "note");
        const items = asOptionalExpenseItems(body.items);

        const result = await registerExpenseUseCase.execute({
          householdId: asRequiredString(params.householdId, "householdId"),
          categoryId: asRequiredString(body.categoryId, "categoryId"),
          payerMembershipId: asRequiredString(body.payerMembershipId, "payerMembershipId"),
          actorMembershipId: asRequiredString(body.actorMembershipId, "actorMembershipId"),
          date: asRequiredString(body.date, "date"),
          totalAmount: asRequiredPositiveInteger(body.totalAmount, "totalAmount"),
          split: asRequiredExpenseSplit(body.split),
          ...(note ? { note } : {}),
          ...(items ? { items } : {}),
        });

        sendJson(res, 201, {
          expenseId: result.expense.id,
          householdId: result.expense.householdId,
          categoryId: result.expense.categoryId,
          payerMembershipId: result.expense.payerMembershipId,
          date: result.expense.date.toISOString(),
          totalAmount: result.expense.totalAmount,
          status: result.expense.status,
          ...(result.expense.note ? { note: result.expense.note } : {}),
          items: result.expense.items,
          split: {
            mode: result.expense.split.mode,
            shares: result.expense.split.shares.map((share) => ({
              membershipId: share.membershipId,
              assignedAmount: share.assignedAmount,
              ...(share.weightUsed !== undefined ? { weightUsed: share.weightUsed } : {}),
            })),
          },
          audit: {
            createdByMembershipId: result.expense.audit.createdByMembershipId,
            createdAt: result.expense.audit.createdAt.toISOString(),
          },
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

const asRequiredPreferenceMode = (
  value: unknown,
): "INCLUDE_DEFAULT" | "EXCLUDE_DEFAULT" => {
  if (value !== "INCLUDE_DEFAULT" && value !== "EXCLUDE_DEFAULT") {
    throw new ValidationError("mode must be INCLUDE_DEFAULT or EXCLUDE_DEFAULT");
  }

  return value;
};

const asRequiredRequestType = (value: unknown): "TEMPORARY_EXCLUDE" => {
  if (value !== "TEMPORARY_EXCLUDE") {
    throw new ValidationError("requestType must be TEMPORARY_EXCLUDE");
  }

  return value;
};

const asRequiredDecision = (value: unknown): "APPROVED" | "REJECTED" => {
  if (value !== "APPROVED" && value !== "REJECTED") {
    throw new ValidationError("decision must be APPROVED or REJECTED");
  }

  return value;
};

const asOptionalNumber = (value: unknown, fieldName: string): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${fieldName} must be a finite number`);
  }

  return value;
};

const asOptionalString = (value: unknown, fieldName: string): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

const asOptionalNullableString = (
  value: unknown,
  fieldName: string,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty string or null`);
  }

  return value.trim();
};

const asRequiredPositiveInteger = (value: unknown, fieldName: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }

  return value;
};

const asRequiredNonNegativeInteger = (value: unknown, fieldName: string): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ValidationError(`${fieldName} must be an integer >= 0`);
  }

  return value;
};

const asRequiredExpenseSplit = (value: unknown): RegisterExpenseSplitInput => {
  const split = asObject(value);
  const mode = split.mode;

  if (mode === "AUTO_WEIGHTED") {
    return { mode: "AUTO_WEIGHTED" };
  }

  if (mode === "MANUAL") {
    const rawShares = split.shares;
    if (!Array.isArray(rawShares)) {
      throw new ValidationError("split.shares must be an array for MANUAL mode");
    }

    return {
      mode: "MANUAL",
      shares: rawShares.map((rawShare, index) => {
        const share = asObject(rawShare);
        return {
          membershipId: asRequiredString(
            share.membershipId,
            `split.shares[${index}].membershipId`,
          ),
          assignedAmount: asRequiredNonNegativeInteger(
            share.assignedAmount,
            `split.shares[${index}].assignedAmount`,
          ),
        };
      }),
    };
  }

  throw new ValidationError("split.mode must be AUTO_WEIGHTED or MANUAL");
};

const asOptionalExpenseItems = (value: unknown): RegisterExpenseItemInput[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new ValidationError("items must be an array");
  }

  return value.map((rawItem, index) => {
    const item = asObject(rawItem);
    const description = asRequiredString(item.description, `items[${index}].description`);
    const quantity = asOptionalNumber(item.quantity, `items[${index}].quantity`);
    if (quantity !== undefined && quantity <= 0) {
      throw new ValidationError(`items[${index}].quantity must be > 0`);
    }
    const unit = asOptionalString(item.unit, `items[${index}].unit`);
    const note = asOptionalString(item.note, `items[${index}].note`);

    return {
      description,
      ...(quantity !== undefined ? { quantity } : {}),
      ...(unit ? { unit } : {}),
      ...(note ? { note } : {}),
    };
  });
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
