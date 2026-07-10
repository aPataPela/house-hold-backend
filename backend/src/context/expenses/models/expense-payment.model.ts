import mongoose, { Schema } from "mongoose";
import type { ExpensePayment } from "../../shared/types/entities";

const expensePaymentSchema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    householdId: { type: String, required: true },
    expenseId: { type: String, required: true },
    membershipId: { type: String, required: true },
    amount: { type: Number, required: true },
    createdByMembershipId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

expensePaymentSchema.index({ householdId: 1, expenseId: 1, createdAt: 1, _id: 1 });
expensePaymentSchema.index({ householdId: 1, membershipId: 1, createdAt: 1, _id: 1 });

export const ExpensePaymentModel = mongoose.model<ExpensePayment>(
  "ExpensePayment",
  expensePaymentSchema,
);
