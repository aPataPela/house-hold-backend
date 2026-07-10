import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import { householdResponse } from "@context/shared/http/serialize";
import type { HouseholdService } from "@context/households/services/household.service";

export class CreateHouseholdController implements BaseController {
  constructor(private readonly service: HouseholdService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const user = (req as Partial<AuthenticatedRequest>).user;
    const result = await this.service.create({
      ...req.body,
      createdByUserId: user?.id ?? req.body.createdByUserId,
    });
    res
      .status(201)
      .json(householdResponse(result.household, result.membership.id, { includeInviteCode: !!user }));
  }
}
