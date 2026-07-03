import mongoose, { Schema } from "mongoose";
import type { CategoryExclusion } from "../../shared/types/entities";

const categoryExclusionSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: String,
    membershipId: String,
    categoryId: String,
    periodStart: Date,
    periodEnd: Date,
    reason: String,
    status: String,
    createdByMembershipId: String,
    createdAt: Date,
    cancelledByMembershipId: String,
    cancelledAt: Date,
  },
  { versionKey: false },
);

categoryExclusionSchema.index({
  householdId: 1,
  categoryId: 1,
  membershipId: 1,
  status: 1,
  periodStart: 1,
  periodEnd: 1,
});

export const CategoryExclusionModel = mongoose.model<CategoryExclusion>(
  "CategoryExclusion",
  categoryExclusionSchema,
);
