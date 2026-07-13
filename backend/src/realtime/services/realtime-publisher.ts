import { randomUUID } from "node:crypto";
import type { RealtimeEvent, RealtimePublisher } from "../contracts";
import { sharedRealtimeOutboxStore } from "./mongo-realtime-outbox.store";

export class OutboxRealtimePublisher implements RealtimePublisher {
  constructor(private readonly now = () => new Date()) {}

  async publish(event: RealtimeEvent): Promise<void> {
    await sharedRealtimeOutboxStore.append({
      ...event,
      id: event.id || randomUUID(),
      occurredAt: event.occurredAt || this.now().toISOString(),
      version: event.version || 1,
    });
  }
}
