import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import { exclusionResponse } from "@context/shared/http/serialize";
import type { ParticipationService } from "@context/participation/services/participation.service";

export class CancelCategoryExclusionController implements BaseController {
  constructor(private readonly service: ParticipationService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    res.json(
      exclusionResponse(
        await this.service.cancelExclusion(
          req.params.householdId as string,
          req.params.exclusionId as string,
          req.body,
        ),
      ),
    );
  }
}
