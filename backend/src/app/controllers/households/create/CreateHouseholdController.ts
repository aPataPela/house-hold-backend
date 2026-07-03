import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import { householdResponse } from "@context/shared/http/serialize";
import type { HouseholdService } from "@context/households/services/household.service";

export class CreateHouseholdController implements BaseController {
  constructor(private readonly service: HouseholdService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.create(req.body);
    res.status(201).json(householdResponse(result.household, result.membership.id));
  }
}
