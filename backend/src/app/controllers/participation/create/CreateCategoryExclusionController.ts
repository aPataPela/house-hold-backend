import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import { exclusionResponse } from "@context/shared/http/serialize";
import type { ParticipationService } from "@context/participation/services/participation.service";

export class CreateCategoryExclusionController implements BaseController {
  constructor(private readonly service: ParticipationService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    res
      .status(201)
      .json(exclusionResponse(await this.service.createExclusion(req.params.householdId as string, req.body)));
  }
}
