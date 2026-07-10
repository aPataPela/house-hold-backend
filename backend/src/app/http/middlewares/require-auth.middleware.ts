import type { NextFunction, Request, RequestHandler, Response } from "express";
import container from "@app/dependency-injection";
import type { AuthService } from "@context/users/services/auth.service";
import { forbidden } from "@context/shared/errors/app-error";
import type { User } from "@context/shared/types/entities";

export type AuthenticatedRequest = Request & {
  user: User;
};

export const requireAuth: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authorization = req.header("authorization") ?? "";
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) throw forbidden("authorization bearer token is required");
    const service: AuthService = container.get("Service.Auth");
    (req as AuthenticatedRequest).user = await service.authenticate(token);
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authorization = req.header("authorization");
    if (!authorization) return next();
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) throw forbidden("authorization bearer token is invalid");
    const service: AuthService = container.get("Service.Auth");
    (req as AuthenticatedRequest).user = await service.authenticate(token);
    return next();
  } catch (error) {
    return next(error);
  }
};
