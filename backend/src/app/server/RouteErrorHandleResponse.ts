import type { NextFunction, Request, Response } from "express";
import container from "@app/dependency-injection";
import type ConsoleLogger from "@context/shared/infrastructure/impl/ConsoleLogger";

const logger: ConsoleLogger = container.get("Shared.Logger");

export const RouteErrorHandlerResponse = (req: Request, res: Response, next: NextFunction): Response => {
  void next;
  logger.error(`invalid route ${req.method} ${req.originalUrl}`);
  return res.status(404).json({ error: { code: "ROUTE_NOT_FOUND", message: "route not found" } });
};
