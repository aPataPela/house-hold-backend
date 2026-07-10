import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthService } from "@context/users/services/auth.service";

export class RefreshController implements BaseController {
  constructor(private readonly service: AuthService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const result = await this.service.refresh(req.body);
    res.status(200).json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  }
}
