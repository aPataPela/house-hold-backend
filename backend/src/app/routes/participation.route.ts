import type { NextFunction, Request, Response, Router } from "express";
import container from "@app/dependency-injection";
import { CreateCategoryExclusionController } from "@app/controllers/participation/create/CreateCategoryExclusionController";
import { CancelCategoryExclusionController } from "@app/controllers/participation/create/CancelCategoryExclusionController";
import { ListParticipationRulesController } from "@app/controllers/participation/find/ListParticipationRulesController";
import { SetPreferenceController } from "@app/controllers/participation/update/SetPreferenceController";
import { requireAuth } from "@app/http/middlewares/require-auth.middleware";
import { validateBody, validateQuery } from "@app/http/middlewares/validate.middleware";
import {
  cancelExclusionSchema,
  createExclusionSchema,
  listParticipationRulesQuerySchema,
  setPreferenceSchema,
} from "@context/participation/validators/participation.validator";

export const register = (router: Router): void => {
  const setPreferenceController: SetPreferenceController = container.get(
    "Controller.Participation.SetPreference",
  );
  const createExclusionController: CreateCategoryExclusionController = container.get(
    "Controller.Participation.CreateExclusion",
  );
  const cancelExclusionController: CancelCategoryExclusionController = container.get(
    "Controller.Participation.CancelExclusion",
  );
  const listRulesController: ListParticipationRulesController = container.get(
    "Controller.Participation.ListRules",
  );

  router.get(
    "/api/v1/households/:householdId/participation-rules",
    requireAuth,
    validateQuery(listParticipationRulesQuerySchema),
    (req: Request, res: Response, next: NextFunction) => {
      return listRulesController.run(req, res, next);
    },
  );

  router.put(
    "/api/v1/households/:householdId/categories/:categoryId/preferences/:membershipId",
    validateBody(setPreferenceSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return setPreferenceController.run(req, res, next);
    },
  );

  router.post(
    "/api/v1/households/:householdId/category-exclusions",
    validateBody(createExclusionSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return createExclusionController.run(req, res, next);
    },
  );

  router.post(
    "/api/v1/households/:householdId/category-exclusions/:exclusionId/cancel",
    validateBody(cancelExclusionSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return cancelExclusionController.run(req, res, next);
    },
  );
};
