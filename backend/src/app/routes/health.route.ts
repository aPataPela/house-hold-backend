import type { NextFunction, Request, Response, Router } from "express";
import container from "@app/dependency-injection";
import GetHealthController from "@app/controllers/health/GetHealthController";

export const register = (router: Router): void => {
  const controller: GetHealthController = container.get("Controller.Health");
  router.get("/health", (req: Request, res: Response, next: NextFunction) => {
    return controller.run(req, res, next);
  });
};
