import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import { preferenceResponse } from "@context/shared/http/serialize";
import type { ParticipationService } from "@context/participation/services/participation.service";

export class SetPreferenceController implements BaseController {
  constructor(private readonly service: ParticipationService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const value = await this.service.setPreference(
      req.params.householdId as string,
      req.params.categoryId as string,
      req.params.membershipId as string,
      req.body,
    );
    res.json(preferenceResponse(value));
  }
}
