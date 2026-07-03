import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import { categoryResponse } from "@context/shared/http/serialize";
import type { HouseholdService } from "@context/households/services/household.service";

export class CreateCategoryController implements BaseController {
  constructor(private readonly service: HouseholdService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    res
      .status(201)
      .json(categoryResponse(await this.service.createCategory(req.params.householdId as string, req.body)));
  }
}
