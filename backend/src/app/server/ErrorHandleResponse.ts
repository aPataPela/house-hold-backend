import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodIssue } from "zod";
import container from "@app/dependency-injection";
import type ConsoleLogger from "@context/shared/infrastructure/impl/ConsoleLogger";
import { AppError } from "@context/shared/errors/app-error";

const logger: ConsoleLogger = container.get("Shared.Logger");

const isAppError = (
  error: unknown,
): error is { status: number; code: string; message: string; details?: unknown } =>
  error instanceof AppError ||
  (typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string");

const isZodError = (error: unknown): error is ZodError | { issues: ZodIssue[] } =>
  error instanceof ZodError ||
  (typeof error === "object" && error !== null && "issues" in error && Array.isArray(error.issues));

export const ErrorHandlerResponse = (
  error: Error | unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  void next;
  printError(error, req);
  if (isZodError(error)) {
    const issues = error instanceof ZodError ? error.issues : error.issues;
    const zodError = new ZodError(issues);
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "request validation failed", details: zodError.flatten() },
    });
  }
  if (isAppError(error)) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
  }
  if (typeof error === "object" && error && "code" in error && error.code === 11000) {
    return res
      .status(409)
      .json({ error: { code: "DUPLICATE_RESOURCE", message: "resource already exists" } });
  }
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "internal server error" } });
};

const printError = (error: unknown, req: Request): void => {
  const value =
    error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
  logger.error(
    `--------- [REQUEST FAIL]: ${req.originalUrl}
      --------- [REQUEST HEADERS]: ${JSON.stringify(req.headers)}
      --------- [REQUEST BODY]: ${JSON.stringify(req.body)}
      --------- [REQUEST PARAMS]: ${JSON.stringify(req.params)}
      --------- [REQUEST QUERY]: ${JSON.stringify(req.query)}
      --------- [ERROR]: ${JSON.stringify(value)}`,
  );
};
