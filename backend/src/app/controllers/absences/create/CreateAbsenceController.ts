import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import { absenceResponse } from "@context/shared/http/serialize";
import type { AbsenceService } from "@context/absences/services/absence.service";

export class CreateAbsenceController implements BaseController {
  constructor(private readonly service: AbsenceService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    res
      .status(201)
      .json(
        absenceResponse(
          await this.service.createAbsence(
            req.params.householdId as string,
            (req as AuthenticatedRequest).user.id,
            req.body,
          ),
        ),
      );
  }
}
