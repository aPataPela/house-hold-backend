import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import type { RealtimeHandshakeService } from "@realtime/services/realtime-handshake.service";

export class CreateRealtimeSessionController implements BaseController {
  constructor(private readonly service: RealtimeHandshakeService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const { householdId } = req.body as { householdId?: string };
    const session = await this.service.createSession((req as AuthenticatedRequest).user.id, {
      householdId: householdId as string,
    });
    res.status(201).json(session);
  }
}
