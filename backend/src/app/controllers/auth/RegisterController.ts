import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import { userResponse } from "@context/shared/http/serialize";
import type { AuthService } from "@context/users/services/auth.service";

export class RegisterController implements BaseController {
  constructor(private readonly service: AuthService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.register(req.body);
    res.status(201).json({
      user: userResponse(result.user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }
}
