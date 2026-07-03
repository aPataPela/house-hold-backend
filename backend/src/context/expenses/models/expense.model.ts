import mongoose, { Schema } from "mongoose";
import type { Expense } from "../../shared/types/entities";

const expenseSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: String,
    categoryId: String,
    payerMembershipId: String,
    date: Date,
    totalAmount: Number,
    note: String,
    status: String,
    items: [{ _id: false, description: String, quantity: Number, unit: String, note: String }],
    split: {
      mode: String,
      shares: [{ _id: false, membershipId: String, assignedAmount: Number, weightUsed: Number }],
    },
    audit: { createdByMembershipId: String, createdAt: Date, updatedAt: Date },
  },
  { versionKey: false },
);

expenseSchema.index({ householdId: 1, status: 1, date: -1, _id: -1 });
expenseSchema.index({ householdId: 1, categoryId: 1, status: 1, date: -1, _id: -1 });

export const ExpenseModel = mongoose.model<Expense>("Expense", expenseSchema);
