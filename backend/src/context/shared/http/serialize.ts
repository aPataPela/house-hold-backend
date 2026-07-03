import type {
  CategoryExclusion,
  Category,
  Expense,
  Household,
  Membership,
  Preference,
} from "../types/entities";
import { toDateString } from "../utils/date";

export const householdResponse = (value: Household, creatorMembershipId: string) => ({
  householdId: value.id,
  name: value.name,
  currency: value.currency,
  governanceSettings: { categoryParticipationApprovalMode: value.approvalMode },
  createdAt: value.createdAt.toISOString(),
  creatorMembershipId,
});

export const membershipResponse = (value: Membership) => ({
  membershipId: value.id,
  householdId: value.householdId,
  userId: value.userId,
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
