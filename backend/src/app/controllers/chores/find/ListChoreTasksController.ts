import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { ChoreService } from "@context/chores/services/chore.service";
import { choreTaskSummaryResponse } from "@context/shared/http/serialize";

export class ListChoreTasksController implements BaseController {
  constructor(private readonly service: ChoreService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.listTasks(req.params.householdId as string);
    res.json({ tasks: result.map(choreTaskSummaryResponse) });
  }
}
