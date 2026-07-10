import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must use YYYY-MM-DD");

export const createCommonAreaSchema = z.object({
  name: z.string().trim().min(1),
  createdByMembershipId: z.string().min(1),
});

export const createChoreTaskSchema = z.object({
  commonAreaId: z.string().min(1),
  name: z.string().trim().min(1),
  priority: z.number().int().positive(),
  assigneeLimit: z.number().int().positive(),
  createdByMembershipId: z.string().min(1),
});

export const generateChoreWeekSchema = z.object({
  weekStart: dateSchema,
  createdByMembershipId: z.string().min(1),
});

export const markChoreAssignmentSchema = z.object({
  status: z.enum(["DONE", "NOT_DONE"]),
  markedByMembershipId: z.string().min(1),
});
