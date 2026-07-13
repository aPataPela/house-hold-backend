import { RealtimeOutboxModel } from "../models/realtime-outbox.model";
import type { RealtimeEvent, RealtimeOutboxStore } from "../contracts";

export class MongoRealtimeOutboxStore implements RealtimeOutboxStore {
  async append(event: RealtimeEvent): Promise<void> {
    await RealtimeOutboxModel.create({
      ...event,
      _id: event.id,
      createdAt: new Date(event.occurredAt),
    });
  }

  async watch(handler: (event: RealtimeEvent) => Promise<void> | void): Promise<() => Promise<void>> {
    const stream = RealtimeOutboxModel.watch([{ $match: { operationType: "insert" } }], {
      fullDocument: "default",
    });

    stream.on("change", (event) => {
      const fullDocument = event.fullDocument as RealtimeEvent & { createdAt: Date } | undefined;
      if (!fullDocument) return;
      void Promise.resolve(
        handler({
          id: fullDocument.id,
          type: fullDocument.type,
          householdId: fullDocument.householdId,
          occurredAt: fullDocument.occurredAt,
          version: fullDocument.version,
          payload: fullDocument.payload,
        }),
      ).catch(() => undefined);
    });

    stream.on("error", () => undefined);

    return async () => {
      await stream.close();
    };
  }
}

export const sharedRealtimeOutboxStore = new MongoRealtimeOutboxStore();
