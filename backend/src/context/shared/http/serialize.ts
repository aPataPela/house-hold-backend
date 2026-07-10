import type {
  ChoreAssignment,
  ChoreAssignmentStatus,
  ChoreTask,
  CategoryExclusion,
  Category,
  CommonArea,
  Expense,
  Household,
  Membership,
  Preference,
  User,
} from "../types/entities";
import type { ChoreTaskSummary, ChoreWeekTask } from "../../chores/services/chore.service";
import { toDateString } from "../utils/date";

export const householdResponse = (
  value: Household,
  creatorMembershipId: string,
  options: { includeInviteCode?: boolean } = {},
) => ({
  householdId: value.id,
  name: value.name,
  currency: value.currency,
  governanceSettings: { categoryParticipationApprovalMode: value.approvalMode },
  createdAt: value.createdAt.toISOString(),
  creatorMembershipId,
  ...(options.includeInviteCode && value.inviteCode ? { inviteCode: value.inviteCode } : {}),
});

export const userResponse = (value: User) => ({
  userId: value.id,
  name: value.name,
  email: value.email,
  createdAt: value.createdAt.toISOString(),
});

export const membershipResponse = (value: Membership) => ({
  membershipId: value.id,
  householdId: value.householdId,
  userId: value.userId,
  ...(value.userName ? { userName: value.userName } : {}),
  ...(value.householdName ? { householdName: value.householdName } : {}),
  role: value.role,
  status: value.status,
  joinedAt: value.joinedAt.toISOString(),
});

export const categoryResponse = (value: Category) => ({
  categoryId: value.id,
  householdId: value.householdId,
  name: value.name,
  createdAt: value.createdAt.toISOString(),
});

export const preferenceResponse = (value: Preference) => ({
  preferenceId: value.id,
  membershipId: value.membershipId,
  categoryId: value.categoryId,
  mode: value.mode,
  weight: value.weight,
  validFrom: toDateString(value.validFrom),
  validTo: value.validTo ? toDateString(value.validTo) : null,
});

export const exclusionResponse = (value: CategoryExclusion) => ({
  exclusionId: value.id,
  membershipId: value.membershipId,
  categoryId: value.categoryId,
  status: value.status,
  periodStart: toDateString(value.periodStart),
  periodEnd: toDateString(value.periodEnd),
  audit: {
    createdByMembershipId: value.createdByMembershipId,
    createdAt: value.createdAt.toISOString(),
    ...(value.cancelledByMembershipId ? { cancelledByMembershipId: value.cancelledByMembershipId } : {}),
    ...(value.cancelledAt ? { cancelledAt: value.cancelledAt.toISOString() } : {}),
  },
  ...(value.reason ? { reason: value.reason } : {}),
});

export const expenseResponse = (value: Expense) => ({
  expenseId: value.id,
  householdId: value.householdId,
  categoryId: value.categoryId,
  payerMembershipId: value.payerMembershipId,
  date: toDateString(value.date),
  totalAmount: value.totalAmount,
  status: value.status,
  items: value.items,
  split: value.split,
  audit: {
    ...value.audit,
    createdAt: value.audit.createdAt.toISOString(),
    updatedAt: value.audit.updatedAt.toISOString(),
  },
  ...(value.note ? { note: value.note } : {}),
});

export const commonAreaResponse = (value: CommonArea) => ({
  commonAreaId: value.id,
  householdId: value.householdId,
  name: value.name,
  status: value.status,
  createdByMembershipId: value.createdByMembershipId,
  createdAt: value.createdAt.toISOString(),
});

export const choreTaskResponse = (value: ChoreTask, commonArea?: CommonArea) => ({
  choreTaskId: value.id,
  householdId: value.householdId,
  commonAreaId: value.commonAreaId,
  ...(commonArea ? { commonArea: commonAreaResponse(commonArea) } : {}),
  name: value.name,
  priority: value.priority,
  assigneeLimit: value.assigneeLimit,
  status: value.status,
  createdByMembershipId: value.createdByMembershipId,
  createdAt: value.createdAt.toISOString(),
});

export const choreTaskSummaryResponse = (value: ChoreTaskSummary) =>
  choreTaskResponse(value.task, value.commonArea);

export const choreAssignmentResponse = (value: ChoreAssignment) => ({
  assignmentId: value.id,
  membershipId: value.membershipId,
  status: value.status,
  ...(value.markedByMembershipId ? { markedByMembershipId: value.markedByMembershipId } : {}),
  ...(value.markedAt ? { markedAt: value.markedAt.toISOString() } : {}),
});

export const choreWeekTaskResponse = (value: ChoreWeekTask) => ({
  ...choreTaskResponse(value.task, value.commonArea),
  weeklyStatus: value.status,
  assignments: value.assignments.map(choreAssignmentResponse),
});

export const choreWeekResponse = (value: {
  week: {
    id: string;
    householdId: string;
    weekStart: Date;
    weekEnd: Date;
    createdByMembershipId: string;
    createdAt: Date;
  };
  tasks: Array<{ status: ChoreAssignmentStatus } & ChoreWeekTask>;
}) => ({
  choreWeekId: value.week.id,
  householdId: value.week.householdId,
  weekStart: toDateString(value.week.weekStart),
  weekEnd: toDateString(value.week.weekEnd),
  createdByMembershipId: value.week.createdByMembershipId,
  createdAt: value.week.createdAt.toISOString(),
  tasks: value.tasks.map(choreWeekTaskResponse),
});
