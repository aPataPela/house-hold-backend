import type { NextFunction, Request, Response, Router } from "express";
import container from "@app/dependency-injection";
import { CancelAbsenceController } from "@app/controllers/absences/create/CancelAbsenceController";
import { CreateAbsenceController } from "@app/controllers/absences/create/CreateAbsenceController";
import { GetMonthlySettlementController } from "@app/controllers/absences/find/GetMonthlySettlementController";
import { ListAbsencesController } from "@app/controllers/absences/find/ListAbsencesController";
import { requireAuth } from "@app/http/middlewares/require-auth.middleware";
import { validateBody, validateQuery } from "@app/http/middlewares/validate.middleware";
import {
  cancelAbsenceSchema,
  createAbsenceSchema,
  listAbsencesQuerySchema,
  monthlySettlementQuerySchema,
} from "@context/absences/validators/absence.validator";

export const register = (router: Router): void => {
  const createAbsenceController: CreateAbsenceController = container.get("Controller.Absence.Create");
  const cancelAbsenceController: CancelAbsenceController = container.get("Controller.Absence.Cancel");
  const listAbsencesController: ListAbsencesController = container.get("Controller.Absence.List");
  const monthlySettlementController: GetMonthlySettlementController = container.get(
    "Controller.Absence.MonthlySettlement",
  );

  router.post(
    "/api/v1/households/:householdId/absences",
    requireAuth,
    validateBody(createAbsenceSchema),
    (req: Request, res: Response, next: NextFunction) => createAbsenceController.run(req, res, next),
  );

  router.post(
    "/api/v1/households/:householdId/absences/:absenceId/cancel",
    requireAuth,
    validateBody(cancelAbsenceSchema),
    (req: Request, res: Response, next: NextFunction) => cancelAbsenceController.run(req, res, next),
  );

  router.get(
    "/api/v1/households/:householdId/absences",
    requireAuth,
    validateQuery(listAbsencesQuerySchema),
    (req: Request, res: Response, next: NextFunction) => listAbsencesController.run(req, res, next),
  );

  router.get(
    "/api/v1/households/:householdId/monthly-settlement",
    requireAuth,
    validateQuery(monthlySettlementQuerySchema),
    (req: Request, res: Response, next: NextFunction) => monthlySettlementController.run(req, res, next),
  );
};
