import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { ChoreService } from "@context/chores/services/chore.service";
import { choreTaskResponse } from "@context/shared/http/serialize";

export class CreateChoreTaskController implements BaseController {
  constructor(private readonly service: ChoreService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.createTask(req.params.householdId as string, req.body);
    res.status(201).json(choreTaskResponse(result));
  }
}
