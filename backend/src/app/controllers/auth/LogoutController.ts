import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { AuthService } from "@context/users/services/auth.service";

export class LogoutController implements BaseController {
  constructor(private readonly service: AuthService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    await this.service.logout(req.body);
    res.status(204).send();
  }
}
