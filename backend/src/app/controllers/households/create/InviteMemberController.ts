import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import { membershipResponse } from "@context/shared/http/serialize";
import type { HouseholdService } from "@context/households/services/household.service";

export class InviteMemberController implements BaseController {
  constructor(private readonly service: HouseholdService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    res
      .status(201)
      .json(membershipResponse(await this.service.invite(req.params.householdId as string, req.body)));
  }
}
