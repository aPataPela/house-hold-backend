import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { BaseController } from "@app/controllers/BaseController";
import { version } from "@root/package.json";

export default class GetHealthController implements BaseController {
  async run(_req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    res.status(httpStatus.OK).json({ status: "UP", version });
  }
}
