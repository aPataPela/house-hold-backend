import type { NextFunction, Request, Response } from "express";
import type { BaseController } from "@app/controllers/BaseController";
import type { RealtimeHandshakeService } from "@realtime/services/realtime-handshake.service";
import { openSseRealtimeStream } from "@realtime/transport/sse-transport";
import { sharedRealtimeSubscriptionRegistry } from "@realtime/services/realtime-subscription-registry";

export class StreamRealtimeController implements BaseController {
  constructor(private readonly handshakeService: RealtimeHandshakeService) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    void next;
    const ticket = String(req.query.ticket ?? "");
    const context = this.handshakeService.validateTicket(ticket);
    const connection = openSseRealtimeStream(res, context, (connectionId) => {
      sharedRealtimeSubscriptionRegistry.remove(connectionId);
    });
    sharedRealtimeSubscriptionRegistry.add(connection);
  }
}
