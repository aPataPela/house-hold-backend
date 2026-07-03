import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { BaseController } from "@app/controllers/BaseController";
import type { ExpenseService } from "@context/expenses/services/expense.service";
import type { balanceQuerySchema } from "@context/expenses/validators/expense.validator";

type BalanceQuery = z.infer<typeof balanceQuerySchema>;

export class GetBalanceController implements BaseController {
  constructor(private readonly service: ExpenseService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    res.json(
      await this.service.balance(req.params.householdId as string, res.locals.validatedQuery as BalanceQuery),
    );
  }
}
