import { createServer } from "node:http";

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
  path: string;
  handler: (ctx: {
    req: any;
    res: any;
    path: string;
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

  const routes: HttpRoute[] = [
    {
      method: "GET",
      path: "/health",
      handler: ({ res }) => {
        sendJson(res, 200, {
          status: "ok",
          service: "shared-household-expenses-backend",
        });
      },
    },
    {
      method: "GET",
      path: API_BASE_PATH,
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
      path: `${API_BASE_PATH}/health`,
      handler: ({ res }) => {
        sendJson(res, 200, {
          status: "ok",
          basePath: API_BASE_PATH,
          serverTime: clock.now().toISOString(),
        });
      },
    },
  ];

  return async (req: any, res: any): Promise<void> => {
    try {
      const method = (req.method ?? "GET").toUpperCase();
      const url = new URL(req.url ?? "/", "http://localhost");
      const path = normalizePath(url.pathname);

      const exact = routes.find((route) => route.path === path && route.method === method);
      if (!exact) {
        const hasPath = routes.some((route) => route.path === path);
        if (hasPath) {
          throw new MethodNotAllowedError(method, path);
        }
        throw new RouteNotFoundError(path);
      }

      await exact.handler({ req, res, path, url, appContext, clock, idGenerator });
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
