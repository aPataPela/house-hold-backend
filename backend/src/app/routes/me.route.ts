import type { NextFunction, Request, Response, Router } from "express";
import container from "@app/dependency-injection";
import { GetMeController } from "@app/controllers/me/GetMeController";
import { requireAuth } from "@app/http/middlewares/require-auth.middleware";

export const register = (router: Router): void => {
  const getMeController: GetMeController = container.get("Controller.Me.Get");

  router.get("/api/v1/me", requireAuth, (req: Request, res: Response, next: NextFunction) => {
    return getMeController.run(req, res, next);
  });
};
