import type { NextFunction, Request, Response, Router } from "express";
import container from "@app/dependency-injection";
import { CreateCommonAreaController } from "@app/controllers/chores/create/CreateCommonAreaController";
import { CreateChoreTaskController } from "@app/controllers/chores/create/CreateChoreTaskController";
import { GenerateChoreWeekController } from "@app/controllers/chores/create/GenerateChoreWeekController";
import { ListChoreTasksController } from "@app/controllers/chores/find/ListChoreTasksController";
import { ListCommonAreasController } from "@app/controllers/chores/find/ListCommonAreasController";
import { GetChoreWeekController } from "@app/controllers/chores/find/GetChoreWeekController";
import { MarkChoreAssignmentController } from "@app/controllers/chores/update/MarkChoreAssignmentController";
import { requireAuth } from "@app/http/middlewares/require-auth.middleware";
import { validateBody } from "@app/http/middlewares/validate.middleware";
import {
  createChoreTaskSchema,
  createCommonAreaSchema,
  generateChoreWeekSchema,
  markChoreAssignmentSchema,
} from "@context/chores/validators/chore.validator";

export const register = (router: Router): void => {
  const createCommonAreaController: CreateCommonAreaController = container.get(
    "Controller.Chore.CreateCommonArea",
  );
  const createTaskController: CreateChoreTaskController = container.get("Controller.Chore.CreateTask");
  const generateWeekController: GenerateChoreWeekController = container.get("Controller.Chore.GenerateWeek");
  const listTasksController: ListChoreTasksController = container.get("Controller.Chore.ListTasks");
  const listCommonAreasController: ListCommonAreasController = container.get(
    "Controller.Chore.ListCommonAreas",
  );
  const getWeekController: GetChoreWeekController = container.get("Controller.Chore.GetWeek");
  const markAssignmentController: MarkChoreAssignmentController = container.get(
    "Controller.Chore.MarkAssignment",
  );

  router.post(
    "/api/v1/households/:householdId/common-areas",
    validateBody(createCommonAreaSchema),
    (req: Request, res: Response, next: NextFunction) => createCommonAreaController.run(req, res, next),
  );

  router.get(
    "/api/v1/households/:householdId/common-areas",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => listCommonAreasController.run(req, res, next),
  );

  router.post(
    "/api/v1/households/:householdId/chores/tasks",
    validateBody(createChoreTaskSchema),
    (req: Request, res: Response, next: NextFunction) => createTaskController.run(req, res, next),
  );

  router.get("/api/v1/households/:householdId/chores/tasks", (req, res, next) =>
    listTasksController.run(req, res, next),
  );

  router.post(
    "/api/v1/households/:householdId/chores/weeks",
    validateBody(generateChoreWeekSchema),
    (req: Request, res: Response, next: NextFunction) => generateWeekController.run(req, res, next),
  );

  router.get("/api/v1/households/:householdId/chores/weeks/:weekStart", (req, res, next) =>
    getWeekController.run(req, res, next),
  );

  router.patch(
    "/api/v1/households/:householdId/chores/assignments/:assignmentId",
    validateBody(markChoreAssignmentSchema),
    (req: Request, res: Response, next: NextFunction) => markAssignmentController.run(req, res, next),
  );
};
