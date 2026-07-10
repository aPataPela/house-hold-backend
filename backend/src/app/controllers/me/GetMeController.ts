import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthenticatedRequest } from "@app/http/middlewares/require-auth.middleware";
import { membershipResponse, userResponse } from "@context/shared/http/serialize";
import type { AuthService } from "@context/users/services/auth.service";

export class GetMeController implements BaseController {
  constructor(private readonly service: AuthService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.me((req as AuthenticatedRequest).user.id);
    res.status(200).json({
      user: userResponse(result.user),
      memberships: result.memberships.map(membershipResponse),
    });
  }
}
