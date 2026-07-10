import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import type { ChoreService } from "@context/chores/services/chore.service";
import { commonAreaResponse } from "@context/shared/http/serialize";

export class ListCommonAreasController implements BaseController {
  constructor(private readonly service: ChoreService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const areas = await this.service.listCommonAreas(req.params.householdId as string, {
      requesterUserId: (req as AuthenticatedRequest).user.id,
    });
    res.status(200).json({ areas: areas.map(commonAreaResponse) });
  }
}
