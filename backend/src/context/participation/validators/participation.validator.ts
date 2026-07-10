import { z } from "zod";

const text = z.string().trim().min(1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const setPreferenceSchema = z
  .object({
    mode: z.enum([
      "PARTICIPATES",
      "HALF",
      "NO_PARTICIPATES",
      "INCLUDE_DEFAULT",
      "EXCLUDE_DEFAULT",
    ]),
    weight: z.number().positive().optional(),
    validFrom: date,
    validTo: date.nullable().optional(),
    changedByMembershipId: text,
  })
  .strict();

export const listParticipationRulesQuerySchema = z
  .object({
    on: date,
  })
  .strict();
