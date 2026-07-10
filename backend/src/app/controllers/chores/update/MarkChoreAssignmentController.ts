import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { ChoreService } from "@context/chores/services/chore.service";
import { choreAssignmentResponse } from "@context/shared/http/serialize";

export class MarkChoreAssignmentController implements BaseController {
  constructor(private readonly service: ChoreService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.markAssignment(
      req.params.householdId as string,
      req.params.assignmentId as string,
      req.body,
    );
    res.json(choreAssignmentResponse(result));
  }
}
