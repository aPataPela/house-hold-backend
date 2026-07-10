import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { ChoreService } from "@context/chores/services/chore.service";
import { commonAreaResponse } from "@context/shared/http/serialize";

export class CreateCommonAreaController implements BaseController {
  constructor(private readonly service: ChoreService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.createCommonArea(req.params.householdId as string, req.body);
    res.status(201).json(commonAreaResponse(result));
  }
}
