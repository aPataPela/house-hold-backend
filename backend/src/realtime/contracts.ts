import type { Response } from "express";

export * from "./event-types";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type RealtimeEvent = {
  id: string;
  type: string;
  householdId: string;
  occurredAt: string;
  version: number;
  payload: JsonValue;
};

export type RealtimeEnvelope = {
  channel: "household";
  event: RealtimeEvent;
  sequence: string;
};

export type RealtimeHandshakeRequest = {
  householdId: string;
};

export type RealtimeHandshakeResponse = {
  ticket: string;
  expiresAt: string;
  streamUrl: string;
};

export type RealtimeConnectionContext = {
  connectionId: string;
  ticketId: string;
  userId: string;
  membershipId: string;
  householdId: string;
  createdAt: string;
  expiresAt: string;
};

export type RealtimeConnection = {
  readonly connectionId: string;
  readonly householdId: string;
  send(envelope: RealtimeEnvelope): void;
  heartbeat(): void;
  close(): void;
};

export type RealtimeTransportResponse = Response & {
  flushHeaders?: () => void;
};

export interface RealtimePublisher {
  publish(event: RealtimeEvent): Promise<void>;
}

export interface RealtimeOutboxStore {
  append(event: RealtimeEvent): Promise<void>;
  watch(handler: (event: RealtimeEvent) => Promise<void> | void): Promise<() => Promise<void>>;
}

export interface RealtimeSubscriptionRegistry {
  add(connection: RealtimeConnection): void;
  remove(connectionId: string): void;
  list(householdId: string): RealtimeConnection[];
  count(householdId?: string): number;
}

export interface RealtimeDeliveryPolicy {
  shouldDeliver(event: RealtimeEvent, householdId: string): boolean;
}

export interface RealtimeOrchestrator {
  start(): Promise<void>;
  stop(): Promise<void>;
}
