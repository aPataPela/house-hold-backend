import { createHmac, randomUUID } from "node:crypto";
import type { RealtimeConnectionContext } from "../contracts";

type TicketPayload = {
  ticketId: string;
  connectionId: string;
  userId: string;
  membershipId: string;
  householdId: string;
  createdAt: string;
  expiresAt: string;
};

const base64url = (value: Buffer | string) => Buffer.from(value).toString("base64url");
const fromBase64url = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const secret = () => process.env.REALTIME_SECRET ?? process.env.JWT_SECRET ?? "household-v1-realtime-secret";

export const createRealtimeTicket = (input: {
  userId: string;
  membershipId: string;
  householdId: string;
  now: Date;
  ttlMs: number;
}) => {
  const ticketId = randomUUID();
  const createdAt = input.now.toISOString();
  const expiresAt = new Date(input.now.getTime() + input.ttlMs).toISOString();
  const payload: TicketPayload = {
    ticketId,
    connectionId: ticketId,
    userId: input.userId,
    membershipId: input.membershipId,
    householdId: input.householdId,
    createdAt,
    expiresAt,
  };
  const encoded = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret()).update(encoded).digest("base64url");
  return { ticket: `${encoded}.${signature}`, expiresAt, ticketId };
};

export const verifyRealtimeTicket = (ticket: string, now = new Date()): RealtimeConnectionContext => {
  const [encoded, signature] = ticket.split(".");
  if (!encoded || !signature) {
    throw new Error("invalid realtime ticket");
  }
  const expected = createHmac("sha256", secret()).update(encoded).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !expectedBuffer.equals(actualBuffer)) {
    throw new Error("invalid realtime ticket");
  }
  const payload = JSON.parse(fromBase64url(encoded)) as TicketPayload;
  if (payload.expiresAt <= now.toISOString()) {
    throw new Error("expired realtime ticket");
  }
  return {
    connectionId: payload.connectionId,
    ticketId: payload.ticketId,
    userId: payload.userId,
    membershipId: payload.membershipId,
    householdId: payload.householdId,
    createdAt: payload.createdAt,
    expiresAt: payload.expiresAt,
  };
};
