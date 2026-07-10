import mongoose, { Schema } from "mongoose";
import type { Absence } from "../../shared/types/entities";

const absenceSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: { type: String, required: true, index: true },
    membershipId: { type: String, required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    reason: String,
    status: { type: String, required: true },
    createdByMembershipId: { type: String, required: true },
    createdAt: { type: Date, required: true },
    cancelledByMembershipId: String,
    cancelledAt: Date,
  },
  { versionKey: false },
);

absenceSchema.index({
  householdId: 1,
  membershipId: 1,
  status: 1,
  periodStart: 1,
  periodEnd: 1,
});

export const AbsenceModel = mongoose.model<Absence>("Absence", absenceSchema);
