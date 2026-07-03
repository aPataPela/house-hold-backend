import express, { Router } from "express";
import helmet from "helmet";
import type { Server as HttpServer } from "node:http";
import container from "@app/dependency-injection";
import { registerRoutes } from "@app/routes";
import { ErrorHandlerResponse } from "@app/server/ErrorHandleResponse";
import { RouteErrorHandlerResponse } from "@app/server/RouteErrorHandleResponse";
import type ConsoleLogger from "@context/shared/infrastructure/impl/ConsoleLogger";

export type ServerOptions = {
  logging?: boolean;
};

export class Server {
  private httpServer?: HttpServer;
  public readonly app = express();
  private readonly logger: ConsoleLogger;

  constructor(
    private readonly port: number,
    options: ServerOptions = {},
  ) {
    this.logger = container.get("Shared.Logger");
    this.app.disable("x-powered-by");
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(helmet.xssFilter());
    this.app.use(helmet.noSniff());
    this.app.use(helmet.hidePoweredBy());
    this.app.use(helmet.frameguard({ action: "deny" }));

    const router = Router();
    this.app.use(router);
    registerRoutes(router);
    this.app.use(ErrorHandlerResponse);
    this.app.use(RouteErrorHandlerResponse);

    if (options.logging !== false) this.logger.info("routes registered");
  }

  listen = async (): Promise<void> => {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(this.port, () => {
        this.logger.info(`household-api listening on ${this.port}`);
        resolve();
      });
    });
  };

  getHTTPServer = (): HttpServer | undefined => {
    return this.httpServer;
  };

  stop = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!this.httpServer) return resolve();
      this.httpServer.close((error) => {
        if (error) return reject(error);
        return resolve();
      });
    });
  };
}
