import { z } from "zod";

const text = z.string().trim().min(1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const month = z.string().regex(/^\d{4}-\d{2}$/);

export const createAbsenceSchema = z
  .object({
    membershipId: text,
    periodStart: date,
    periodEnd: date,
    reason: text.optional(),
    createdByMembershipId: text,
  })
  .strict();

export const cancelAbsenceSchema = z
  .object({
    cancelledByMembershipId: text,
  })
  .strict();

export const listAbsencesQuerySchema = z
  .object({
    from: date,
    to: date,
  })
  .strict();

export const monthlySettlementQuerySchema = z
  .object({
    month,
  })
  .strict();
