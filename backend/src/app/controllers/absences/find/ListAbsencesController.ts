import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import { absenceResponse } from "@context/shared/http/serialize";
import type { AbsenceService } from "@context/absences/services/absence.service";
import type { listAbsencesQuerySchema } from "@context/absences/validators/absence.validator";

type AbsenceQuery = z.infer<typeof listAbsencesQuerySchema>;

export class ListAbsencesController implements BaseController {
  constructor(private readonly service: AbsenceService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.listAbsences(
      req.params.householdId as string,
      (req as AuthenticatedRequest).user.id,
      res.locals.validatedQuery as AbsenceQuery,
    );
    res.json({ absences: result.map(absenceResponse) });
  }
}
