import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { BaseController } from "@app/controllers/BaseController";
import { expenseResponse } from "@context/shared/http/serialize";
import type { ExpenseService } from "@context/expenses/services/expense.service";
import type { listExpensesQuerySchema } from "@context/expenses/validators/expense.validator";

type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

export class ListExpensesController implements BaseController {
  constructor(private readonly service: ExpenseService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.list(
      req.params.householdId as string,
      res.locals.validatedQuery as ListExpensesQuery,
    );
    res.json({ expenses: result.expenses.map(expenseResponse), page: result.page });
  }
}
