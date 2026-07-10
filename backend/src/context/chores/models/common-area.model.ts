import mongoose, { Schema } from "mongoose";
import type { CommonArea } from "../../shared/types/entities";

const commonAreaSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    status: { type: String, required: true },
    createdByMembershipId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

commonAreaSchema.index(
  { householdId: 1, normalizedName: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } },
);

export const CommonAreaModel = mongoose.model<CommonArea>("CommonArea", commonAreaSchema);
