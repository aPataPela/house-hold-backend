import mongoose, { Schema } from "mongoose";
import type { Membership } from "../../shared/types/entities";

const membershipSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: { type: String, index: true },
    userId: String,
    role: String,
    status: String,
    joinedAt: Date,
    leftAt: Date,
  },
  { versionKey: false },
);

membershipSchema.index(
  { householdId: 1, userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } },
);

export const MembershipModel = mongoose.model<Membership>("Membership", membershipSchema);
