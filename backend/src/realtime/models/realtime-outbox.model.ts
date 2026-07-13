import mongoose from "mongoose";

export type RealtimeOutboxRecord = {
  id: string;
  type: string;
  householdId: string;
  occurredAt: string;
  version: number;
  payload: unknown;
  createdAt: Date;
};

const realtimeOutboxSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    householdId: { type: String, required: true, index: true },
    occurredAt: { type: String, required: true },
    version: { type: Number, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

realtimeOutboxSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export const RealtimeOutboxModel = mongoose.model<RealtimeOutboxRecord>(
  "RealtimeOutbox",
  realtimeOutboxSchema,
);
