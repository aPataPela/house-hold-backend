import mongoose, { Schema } from "mongoose";
import type { ChoreAssignment } from "../../shared/types/entities";

const choreAssignmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: { type: String, required: true, index: true },
    weekId: { type: String, required: true, index: true },
    weekStart: { type: Date, required: true, index: true },
    weekEnd: { type: Date, required: true },
    commonAreaId: { type: String, required: true },
    taskId: { type: String, required: true, index: true },
    membershipId: { type: String, required: true, index: true },
    status: { type: String, required: true },
    markedByMembershipId: String,
    markedAt: Date,
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

choreAssignmentSchema.index({ weekId: 1, membershipId: 1 }, { unique: true });
choreAssignmentSchema.index({ weekId: 1, taskId: 1, membershipId: 1 }, { unique: true });
choreAssignmentSchema.index({ householdId: 1, taskId: 1, membershipId: 1, weekStart: 1 });

export const ChoreAssignmentModel = mongoose.model<ChoreAssignment>(
  "ChoreAssignment",
  choreAssignmentSchema,
);
