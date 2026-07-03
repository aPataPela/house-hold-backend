import type { NextFunction, Request, Response, Router } from "express";
import container from "@app/dependency-injection";
import { CreateHouseholdController } from "@app/controllers/households/create/CreateHouseholdController";
import { InviteMemberController } from "@app/controllers/households/create/InviteMemberController";
import { CreateCategoryController } from "@app/controllers/households/create/CreateCategoryController";
import { validateBody } from "@app/http/middlewares/validate.middleware";
import {
  createCategorySchema,
  createHouseholdSchema,
  inviteMembershipSchema,
} from "@context/households/validators/household.validator";

export const register = (router: Router): void => {
  const createHouseholdController: CreateHouseholdController = container.get("Controller.Household.Create");
  const inviteMemberController: InviteMemberController = container.get("Controller.Household.InviteMember");
  const createCategoryController: CreateCategoryController = container.get(
    "Controller.Household.CreateCategory",
  );

  router.post(
    "/api/v1/households",
    validateBody(createHouseholdSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return createHouseholdController.run(req, res, next);
    },
  );

  router.post(
    "/api/v1/households/:householdId/memberships",
    validateBody(inviteMembershipSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return inviteMemberController.run(req, res, next);
    },
  );

  router.post(
    "/api/v1/households/:householdId/categories",
    validateBody(createCategorySchema),
    (req: Request, res: Response, next: NextFunction) => {
      return createCategoryController.run(req, res, next);
    },
  );
};
