import type { NextFunction, Request, Response, Router } from "express";
import container from "@app/dependency-injection";
import { LoginController } from "@app/controllers/auth/LoginController";
import { LogoutController } from "@app/controllers/auth/LogoutController";
import { RefreshController } from "@app/controllers/auth/RefreshController";
import { RegisterController } from "@app/controllers/auth/RegisterController";
import { validateBody } from "@app/http/middlewares/validate.middleware";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from "@context/users/validators/auth.validator";

export const register = (router: Router): void => {
  const registerController: RegisterController = container.get("Controller.Auth.Register");
  const loginController: LoginController = container.get("Controller.Auth.Login");
  const refreshController: RefreshController = container.get("Controller.Auth.Refresh");
  const logoutController: LogoutController = container.get("Controller.Auth.Logout");

  router.post(
    "/api/v1/auth/register",
    validateBody(registerSchema),
    (req: Request, res: Response, next: NextFunction) => registerController.run(req, res, next),
  );
  router.post(
    "/api/v1/auth/login",
    validateBody(loginSchema),
    (req: Request, res: Response, next: NextFunction) => loginController.run(req, res, next),
  );
  router.post(
    "/api/v1/auth/refresh",
    validateBody(refreshSchema),
    (req: Request, res: Response, next: NextFunction) => refreshController.run(req, res, next),
  );
  router.post(
    "/api/v1/auth/logout",
    validateBody(logoutSchema),
    (req: Request, res: Response, next: NextFunction) => logoutController.run(req, res, next),
  );
};
