import mongoose, { Schema } from "mongoose";
import type { Preference } from "../../shared/types/entities";

const preferenceSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: String,
    membershipId: String,
    categoryId: String,
    mode: String,
    weight: Number,
    validFrom: Date,
    validTo: Date,
  },
  { versionKey: false },
);

preferenceSchema.index({ householdId: 1, categoryId: 1, membershipId: 1, validFrom: 1, validTo: 1 });

export const PreferenceModel = mongoose.model<Preference>("Preference", preferenceSchema);
