import type { Expense } from "../../domain/expense.js";
import type { Household } from "../../domain/household.js";
import type { CategoryParticipationChangeRequest } from "../../domain/participation-request.js";
import type { MemberCategoryPreference } from "../../domain/preferences.js";

export interface CreateHouseholdInput {
  name: string;
  currency: "CLP";
  createdByUserId: string;
}

export interface CreateHouseholdOutput {
  household: Household;
}

export interface InviteMemberInput {
  householdId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  invitedByMembershipId: string;
}

export interface InviteMemberOutput {
  membershipId: string;
  status: "ACTIVE";
  joinedAt: Date;
}

export interface CreateCategoryInput {
  householdId: string;
  name: string;
  createdByMembershipId: string;
}

export interface CreateCategoryOutput {
  categoryId: string;
  name: string;
}

export interface SetMemberCategoryPreferenceInput {
  householdId: string;
  membershipId: string;
  categoryId: string;
  mode: "INCLUDE_DEFAULT" | "EXCLUDE_DEFAULT";
  weight: number;
  validFrom: string;
  validTo?: string | null;
  changedByMembershipId: string;
}

export interface SetMemberCategoryPreferenceOutput {
  preference: MemberCategoryPreference;
}

export interface RequestTemporaryExclusionInput {
  householdId: string;
  membershipId: string;
  categoryId: string;
  periodStart: string;
  periodEnd: string;
  reason: string;
}

export interface RequestTemporaryExclusionOutput {
  requestId: string;
  status: "PENDING";
}

export interface ApproveRequestInput {
  householdId: string;
  requestId: string;
  decision: "APPROVED" | "REJECTED";
  decidedByMembershipId: string;
  comment?: string;
}

export interface ApproveRequestOutput {
  request: CategoryParticipationChangeRequest;
}

export interface RegisterExpenseOutput {
  expense: Expense;
}

export interface GetHouseholdBalanceInput {
  householdId: string;
  from: string;
  to: string;
}

export interface MemberBalance {
  membershipId: string;
  paid: number;
  assigned: number;
  netBalance: number;
}

export interface GetHouseholdBalanceOutput {
  householdId: string;
  period: {
    from: string;
    to: string;
  };
  members: MemberBalance[];
}

export interface ListExpensesInput {
  householdId: string;
  from: string;
  to: string;
  categoryId?: string;
  status?: "ACTIVE" | "CANCELLED";
  limit?: number;
  cursor?: string;
}

export interface ListExpensesOutput {
  expenses: Expense[];
  nextCursor?: string;
}
