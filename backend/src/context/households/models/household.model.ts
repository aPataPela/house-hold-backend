import mongoose, { Schema } from "mongoose";
import type { Household } from "../../shared/types/entities";

const householdSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    name: String,
    currency: String,
    approvalMode: String,
    createdAt: Date,
  },
  { versionKey: false },
);

export const HouseholdModel = mongoose.model<Household>("Household", householdSchema);
