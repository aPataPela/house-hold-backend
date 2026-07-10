import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import type { HouseholdService } from "@context/households/services/household.service";

export class RegenerateInviteCodeController implements BaseController {
  constructor(private readonly service: HouseholdService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const household = await this.service.regenerateInviteCode(req.params.householdId as string, {
      userId: (req as AuthenticatedRequest).user.id,
    });
    res.status(200).json({ householdId: household.id, inviteCode: household.inviteCode });
  }
}
