import type { NextFunction, Request, Response, Router } from "express";
import container from "@app/dependency-injection";
import { CreateHouseholdController } from "@app/controllers/households/create/CreateHouseholdController";
import { InviteMemberController } from "@app/controllers/households/create/InviteMemberController";
import { CreateCategoryController } from "@app/controllers/households/create/CreateCategoryController";
import { ListCategoriesController } from "@app/controllers/households/find/ListCategoriesController";
import { ListMembersController } from "@app/controllers/households/find/ListMembersController";
import { JoinHouseholdController } from "@app/controllers/households/create/JoinHouseholdController";
import { RegenerateInviteCodeController } from "@app/controllers/households/update/RegenerateInviteCodeController";
import { optionalAuth, requireAuth } from "@app/http/middlewares/require-auth.middleware";
import { validateBody } from "@app/http/middlewares/validate.middleware";
import {
  createCategorySchema,
  createHouseholdSchema,
  inviteMembershipSchema,
  joinHouseholdSchema,
} from "@context/households/validators/household.validator";

export const register = (router: Router): void => {
  const createHouseholdController: CreateHouseholdController = container.get("Controller.Household.Create");
  const inviteMemberController: InviteMemberController = container.get("Controller.Household.InviteMember");
  const joinHouseholdController: JoinHouseholdController = container.get("Controller.Household.Join");
  const regenerateInviteCodeController: RegenerateInviteCodeController = container.get(
    "Controller.Household.RegenerateInviteCode",
  );
  const createCategoryController: CreateCategoryController = container.get(
    "Controller.Household.CreateCategory",
  );
  const listMembersController: ListMembersController = container.get("Controller.Household.ListMembers");
  const listCategoriesController: ListCategoriesController = container.get(
    "Controller.Household.ListCategories",
  );

  router.post(
    "/api/v1/households",
    optionalAuth,
    validateBody(createHouseholdSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return createHouseholdController.run(req, res, next);
    },
  );

  router.post(
    "/api/v1/households/join",
    requireAuth,
    validateBody(joinHouseholdSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return joinHouseholdController.run(req, res, next);
    },
  );

  router.post(
    "/api/v1/households/:householdId/invite-code/regenerate",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
      return regenerateInviteCodeController.run(req, res, next);
    },
  );

  router.post(
    "/api/v1/households/:householdId/memberships",
    validateBody(inviteMembershipSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return inviteMemberController.run(req, res, next);
    },
  );

  router.get(
    "/api/v1/households/:householdId/memberships",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
      return listMembersController.run(req, res, next);
    },
  );

  router.post(
    "/api/v1/households/:householdId/categories",
    validateBody(createCategorySchema),
    (req: Request, res: Response, next: NextFunction) => {
      return createCategoryController.run(req, res, next);
    },
  );

  router.get(
    "/api/v1/households/:householdId/categories",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
      return listCategoriesController.run(req, res, next);
    },
  );
};
