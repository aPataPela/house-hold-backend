import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import { monthlySettlementResponse } from "@context/shared/http/serialize";
import type { AbsenceService } from "@context/absences/services/absence.service";
import type { monthlySettlementQuerySchema } from "@context/absences/validators/absence.validator";

type SettlementQuery = z.infer<typeof monthlySettlementQuerySchema>;

export class GetMonthlySettlementController implements BaseController {
  constructor(private readonly service: AbsenceService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.monthlySettlement(
      req.params.householdId as string,
      (req as AuthenticatedRequest).user.id,
      res.locals.validatedQuery as SettlementQuery,
    );
    res.json(monthlySettlementResponse(result));
  }
}
