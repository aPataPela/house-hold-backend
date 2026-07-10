import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import { exclusionResponse, preferenceResponse } from "@context/shared/http/serialize";
import type { ParticipationService } from "@context/participation/services/participation.service";
import type { listParticipationRulesQuerySchema } from "@context/participation/validators/participation.validator";

type RulesQuery = z.infer<typeof listParticipationRulesQuerySchema>;

export class ListParticipationRulesController implements BaseController {
  constructor(private readonly service: ParticipationService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.listRules(
      req.params.householdId as string,
      (req as AuthenticatedRequest).user.id,
      res.locals.validatedQuery as RulesQuery,
    );
    res.json({
      preferences: result.preferences.map(preferenceResponse),
      exclusions: result.exclusions.map(exclusionResponse),
    });
  }
}
