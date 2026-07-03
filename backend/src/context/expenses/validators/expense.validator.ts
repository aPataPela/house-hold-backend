import { z } from "zod";

const text = z.string().trim().min(1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const item = z
  .object({
    description: text,
    quantity: z.number().positive().optional(),
    unit: text.optional(),
    note: text.optional(),
  })
  .strict();
const share = z.object({ membershipId: text, assignedAmount: z.number().int().nonnegative() }).strict();
const split = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("AUTO_WEIGHTED") }).strict(),
  z.object({ mode: z.literal("MANUAL"), shares: z.array(share).min(1) }).strict(),
]);

export const registerExpenseSchema = z
  .object({
    categoryId: text,
    payerMembershipId: text,
    actorMembershipId: text,
    date,
    totalAmount: z.number().int().positive(),
    note: text.optional(),
    items: z.array(item).optional(),
    split,
  })
  .strict();

export const listExpensesQuerySchema = z
  .object({
    from: date,
    to: date,
    categoryId: text.optional(),
    status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    cursor: text.optional(),
  })
  .strict();

export const balanceQuerySchema = z.object({ from: date, to: date }).strict();
