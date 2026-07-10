import mongoose, { Schema } from "mongoose";
import type { ChoreWeek } from "../../shared/types/entities";

const choreWeekSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: { type: String, required: true, index: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    createdByMembershipId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

choreWeekSchema.index({ householdId: 1, weekStart: 1 }, { unique: true });

export const ChoreWeekModel = mongoose.model<ChoreWeek>("ChoreWeek", choreWeekSchema);
