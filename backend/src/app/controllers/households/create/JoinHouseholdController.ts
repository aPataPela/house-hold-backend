import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import { householdResponse, membershipResponse } from "@context/shared/http/serialize";
import type { HouseholdService } from "@context/households/services/household.service";

export class JoinHouseholdController implements BaseController {
  constructor(private readonly service: HouseholdService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.joinByInviteCode({
      inviteCode: req.body.inviteCode,
      userId: (req as AuthenticatedRequest).user.id,
      livingSince: req.body.livingSince,
    });
    res.status(201).json({
      household: householdResponse(result.household, result.membership.id),
      membership: membershipResponse(result.membership),
    });
  }
}
