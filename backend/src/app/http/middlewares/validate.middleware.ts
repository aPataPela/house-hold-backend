import type { RequestHandler } from "express";
import type { z } from "zod";

export const validateBody =
  <T extends z.ZodTypeAny>(schema: T): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };

export const validateQuery =
  <T extends z.ZodTypeAny>(schema: T): RequestHandler =>
  (req, res, next) => {
    res.locals.validatedQuery = schema.parse(req.query);
    next();
  };
