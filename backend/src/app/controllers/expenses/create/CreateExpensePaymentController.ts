import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import { expenseResponse } from "@context/shared/http/serialize";
import type { ExpenseService } from "@context/expenses/services/expense.service";

export class CreateExpensePaymentController implements BaseController {
  constructor(private readonly service: ExpenseService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    res
      .status(201)
      .json(
        expenseResponse(
          await this.service.registerPayment(
            req.params.householdId as string,
            req.params.expenseId as string,
            req.body,
          ),
        ),
      );
  }
}
