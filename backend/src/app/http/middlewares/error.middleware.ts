import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../../context/shared/errors/app-error";

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

export const errorMiddleware = (error: unknown, _req: Request, res: Response, next: NextFunction) => {
  void next;
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "request validation failed", details: error.flatten() },
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
