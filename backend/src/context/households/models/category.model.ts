import mongoose, { Schema } from "mongoose";
import type { Category } from "../../shared/types/entities";

const categorySchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: String,
    name: String,
    normalizedName: String,
    status: String,
    createdAt: Date,
  },
  { versionKey: false },
);

categorySchema.index({ householdId: 1, normalizedName: 1 }, { unique: true });

export const CategoryModel = mongoose.model<Category>("Category", categorySchema);
