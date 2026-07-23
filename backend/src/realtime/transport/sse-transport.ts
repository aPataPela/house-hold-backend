import type {
  RealtimeConnection,
  RealtimeConnectionContext,
  RealtimeEnvelope,
  RealtimeTransportResponse,
} from "../contracts";

const HEARTBEAT_MS = 15_000;

export class SseRealtimeConnection implements RealtimeConnection {
  private readonly timer: NodeJS.Timeout;
  private closed = false;

  constructor(
    public readonly connectionId: string,
    public readonly householdId: string,
    private readonly res: RealtimeTransportResponse,
    private readonly onClose: (connectionId: string) => void,
  ) {
    this.res.write(`event: realtime.ready\ndata: ${JSON.stringify({ connectionId, householdId })}\n\n`);
    this.timer = setInterval(() => {
      this.heartbeat();
    }, HEARTBEAT_MS);
  }

  send(envelope: RealtimeEnvelope): void {
    if (this.closed) return;
    this.res.write(`id: ${envelope.sequence}\n`);
    this.res.write(`event: ${envelope.event.type}\n`);
    this.res.write(`data: ${JSON.stringify(envelope)}\n\n`);
  }

  heartbeat(): void {
    if (this.closed) return;
    this.res.write(`: heartbeat ${Date.now()}\n\n`);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.timer);
    this.res.end();
    this.onClose(this.connectionId);
  }
}

export const openSseRealtimeStream = (
  res: RealtimeTransportResponse,
  context: RealtimeConnectionContext,
  onClose: (connectionId: string) => void,
) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  return new SseRealtimeConnection(context.connectionId, context.householdId, res, onClose);
};
