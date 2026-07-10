import { z } from "zod";

const text = z.string().trim().min(1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createHouseholdSchema = z
  .object({
    name: text,
    currency: z.literal("CLP"),
    createdByUserId: text.optional(),
    livingSince: date.optional(),
    governanceSettings: z.object({ categoryParticipationApprovalMode: z.literal("ADMIN_ONLY") }).optional(),
  })
  .strict();

export const joinHouseholdSchema = z
  .object({
    inviteCode: text,
    livingSince: date.optional(),
  })
  .strict();

export const inviteMembershipSchema = z
  .object({
    userId: text,
    role: z.enum(["ADMIN", "MEMBER"]),
    invitedByMembershipId: text,
    livingSince: date.optional(),
  })
  .strict();

export const createCategorySchema = z
  .object({
    name: text,
    createdByMembershipId: text,
  })
  .strict();
