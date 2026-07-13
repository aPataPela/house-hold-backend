import mongoose from "mongoose";
import { env } from "@app/config/env";
import container from "@app/dependency-injection";
import { Server } from "@app/server/Server";
import type { RealtimeOrchestrator } from "@realtime/contracts";

export class Run {
  server?: Server;
  private realtimeOrchestrator?: RealtimeOrchestrator;

  async start(): Promise<void> {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5_000 });
    this.realtimeOrchestrator = container.get("Service.Realtime.Orchestrator") as RealtimeOrchestrator;
    await this.realtimeOrchestrator.start();
    this.server = new Server(env.PORT);
    return this.server.listen();
  }

  async stop(): Promise<void> {
    await this.realtimeOrchestrator?.stop();
    await this.server?.stop();
    await mongoose.disconnect();
  }

  get httpServer() {
    return this.server?.getHTTPServer();
  }

  setNow(now: () => Date): void {
    container.set("App.Now", now);
  }
}
