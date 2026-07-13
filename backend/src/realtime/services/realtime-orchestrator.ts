import type ConsoleLogger from "@context/shared/infrastructure/impl/ConsoleLogger";
import type {
  RealtimeDeliveryPolicy,
  RealtimeEnvelope,
  RealtimeEvent,
  RealtimeOrchestrator,
} from "../contracts";
import { sharedRealtimeOutboxStore } from "./mongo-realtime-outbox.store";
import { sharedRealtimeSubscriptionRegistry } from "./realtime-subscription-registry";

export class RealtimeOutboxOrchestrator implements RealtimeOrchestrator {
  private started = false;
  private stopWatch?: (() => Promise<void>) | undefined;

  constructor(private readonly policy: RealtimeDeliveryPolicy, private readonly logger: ConsoleLogger) {}

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.stopWatch = await sharedRealtimeOutboxStore.watch((event) => this.deliver(event));
  }

  async stop(): Promise<void> {
    if (this.stopWatch) {
      await this.stopWatch();
      this.stopWatch = undefined;
    }
    this.started = false;
  }

  private async deliver(event: RealtimeEvent): Promise<void> {
    const targets = sharedRealtimeSubscriptionRegistry.list(event.householdId);
    const envelope: RealtimeEnvelope = {
      channel: "household",
      event,
      sequence: event.id,
    };
    for (const connection of targets) {
      if (!this.policy.shouldDeliver(event, connection.householdId)) {
        continue;
      }
      try {
        connection.send(envelope);
      } catch (error) {
        this.logger.error(error instanceof Error ? error.stack ?? error.message : String(error));
        connection.close();
        sharedRealtimeSubscriptionRegistry.remove(connection.connectionId);
      }
    }
    this.logger.info(`realtime delivered ${event.type} to ${targets.length} connections`);
  }
}
