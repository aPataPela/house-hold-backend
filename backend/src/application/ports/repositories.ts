import type { Category } from "../../domain/category.js";
import type { Expense } from "../../domain/expense.js";
import type { Household } from "../../domain/household.js";
import type { Membership } from "../../domain/membership.js";
import type { CategoryParticipationChangeRequest } from "../../domain/participation-request.js";
import type { MemberCategoryPreference } from "../../domain/preferences.js";

export interface Period {
  from: Date;
  to: Date;
}

export interface HouseholdRepository {
  findById(householdId: string): Promise<Household | null>;
  save(household: Household): Promise<void>;
}

export interface MembershipRepository {
  findById(membershipId: string): Promise<Membership | null>;
  listActiveByHouseholdOnDate(householdId: string, date: Date): Promise<Membership[]>;
  findActiveByHouseholdAndUser(householdId: string, userId: string, date: Date): Promise<Membership | null>;
  save(membership: Membership): Promise<void>;
}

export interface CategoryRepository {
  findById(categoryId: string): Promise<Category | null>;
  findByHouseholdAndNormalizedName(householdId: string, normalizedName: string): Promise<Category | null>;
  save(category: Category): Promise<void>;
}

export interface MemberCategoryPreferenceRepository {
  listByHouseholdCategoryOnDate(
    householdId: string,
    categoryId: string,
    date: Date,
  ): Promise<MemberCategoryPreference[]>;
  listByHouseholdMembershipCategory(
    householdId: string,
    membershipId: string,
    categoryId: string,
  ): Promise<MemberCategoryPreference[]>;
  save(preference: MemberCategoryPreference): Promise<void>;
}

export interface CategoryParticipationChangeRequestRepository {
  listApprovedTemporaryExclusionsOnDate(
    householdId: string,
    categoryId: string,
    date: Date,
  ): Promise<CategoryParticipationChangeRequest[]>;
  findById(requestId: string): Promise<CategoryParticipationChangeRequest | null>;
  save(request: CategoryParticipationChangeRequest): Promise<void>;
}

export interface ExpenseRepository {
  save(expense: Expense): Promise<void>;
  listByHouseholdAndPeriod(
    householdId: string,
    period: Period,
    params?: {
      categoryId?: string;
      status?: "ACTIVE" | "CANCELLED";
      limit?: number;
      cursor?: string;
    },
  ): Promise<Expense[]>;
}

export interface HouseholdBalanceRow {
  membershipId: string;
  paid: number;
  assigned: number;
  netBalance: number;
}

export interface HouseholdBalanceReadModel {
  getBalance(householdId: string, period: Period): Promise<HouseholdBalanceRow[]>;
}
