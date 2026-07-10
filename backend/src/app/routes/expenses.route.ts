import type { NextFunction, Request, Response, Router } from "express";
import container from "@app/dependency-injection";
import { CreateExpensePaymentController } from "@app/controllers/expenses/create/CreateExpensePaymentController";
import { RegisterExpenseController } from "@app/controllers/expenses/create/RegisterExpenseController";
import { GetBalanceController } from "@app/controllers/expenses/find/GetBalanceController";
import { ListExpensesController } from "@app/controllers/expenses/find/ListExpensesController";
import { validateBody, validateQuery } from "@app/http/middlewares/validate.middleware";
import {
  balanceQuerySchema,
  listExpensesQuerySchema,
  registerExpensePaymentSchema,
  registerExpenseSchema,
} from "@context/expenses/validators/expense.validator";

export const register = (router: Router): void => {
  const registerExpenseController: RegisterExpenseController = container.get("Controller.Expense.Register");
  const registerExpensePaymentController: CreateExpensePaymentController =
    container.get("Controller.Expense.Payment");
  const listExpensesController: ListExpensesController = container.get("Controller.Expense.List");
  const balanceController: GetBalanceController = container.get("Controller.Expense.Balance");

  router.post(
    "/api/v1/households/:householdId/expenses",
    validateBody(registerExpenseSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return registerExpenseController.run(req, res, next);
    },
  );

  router.get(
    "/api/v1/households/:householdId/expenses",
    validateQuery(listExpensesQuerySchema),
    (req: Request, res: Response, next: NextFunction) => {
      return listExpensesController.run(req, res, next);
    },
  );

  router.get(
    "/api/v1/households/:householdId/balance",
    validateQuery(balanceQuerySchema),
    (req: Request, res: Response, next: NextFunction) => {
      return balanceController.run(req, res, next);
    },
  );

  router.post(
    "/api/v1/households/:householdId/expenses/:expenseId/payments",
    validateBody(registerExpensePaymentSchema),
    (req: Request, res: Response, next: NextFunction) => {
      return registerExpensePaymentController.run(req, res, next);
    },
  );
};
