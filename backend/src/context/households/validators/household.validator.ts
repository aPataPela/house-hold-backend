import { z } from "zod";

const text = z.string().trim().min(1);

export const createHouseholdSchema = z
  .object({
    name: text,
    currency: z.literal("CLP"),
    createdByUserId: text.optional(),
    governanceSettings: z.object({ categoryParticipationApprovalMode: z.literal("ADMIN_ONLY") }).optional(),
  })
  .strict();

export const joinHouseholdSchema = z
  .object({
    inviteCode: text,
  })
  .strict();

export const inviteMembershipSchema = z
  .object({
    userId: text,
    role: z.enum(["ADMIN", "MEMBER"]),
    invitedByMembershipId: text,
  })
  .strict();

export const createCategorySchema = z
  .object({
    name: text,
    createdByMembershipId: text,
  })
  .strict();
