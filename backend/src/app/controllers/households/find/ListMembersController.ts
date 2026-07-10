import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import { membershipResponse } from "@context/shared/http/serialize";
import type { HouseholdService } from "@context/households/services/household.service";

export class ListMembersController implements BaseController {
  constructor(private readonly service: HouseholdService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const memberships = await this.service.listMembers(req.params.householdId as string, {
      requesterUserId: (req as AuthenticatedRequest).user.id,
    });
    res.status(200).json({ memberships: memberships.map(membershipResponse) });
  }
}
