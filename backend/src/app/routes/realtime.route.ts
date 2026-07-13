import type { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import container from "@app/dependency-injection";
import { requireAuth } from "@app/http/middlewares/require-auth.middleware";
import { validateBody } from "@app/http/middlewares/validate.middleware";
import { CreateRealtimeSessionController } from "@app/controllers/realtime/CreateRealtimeSessionController";
import { StreamRealtimeController } from "@app/controllers/realtime/StreamRealtimeController";

const createSessionSchema = z.object({
  householdId: z.string().min(1),
});

export const register = (router: Router): void => {
  const createSessionController: CreateRealtimeSessionController = container.get(
    "Controller.Realtime.CreateSession",
  );
  const streamController: StreamRealtimeController = container.get("Controller.Realtime.Stream");

  router.post(
    "/api/v1/realtime/sessions",
    requireAuth,
    validateBody(createSessionSchema),
    (req: Request, res: Response, next: NextFunction) => createSessionController.run(req, res, next),
  );

  router.get("/api/v1/realtime/stream", (req: Request, res: Response, next: NextFunction) =>
    streamController.run(req, res, next),
  );
};
