import mongoose, { Schema } from "mongoose";
import type { ChoreTask } from "../../shared/types/entities";

const choreTaskSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: { type: String, required: true, index: true },
    commonAreaId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    priority: { type: Number, required: true },
    assigneeLimit: { type: Number, required: true },
    status: { type: String, required: true },
    createdByMembershipId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

choreTaskSchema.index(
  { householdId: 1, commonAreaId: 1, normalizedName: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } },
);
choreTaskSchema.index({ householdId: 1, status: 1, priority: 1, createdAt: 1 });

export const ChoreTaskModel = mongoose.model<ChoreTask>("ChoreTask", choreTaskSchema);
