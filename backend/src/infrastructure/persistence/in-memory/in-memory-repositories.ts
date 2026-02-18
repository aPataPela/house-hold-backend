import type {
  CategoryParticipationChangeRequestRepository,
  CategoryRepository,
  ExpenseRepository,
  HouseholdBalanceReadModel,
  HouseholdBalanceRow,
  HouseholdRepository,
  MemberCategoryPreferenceRepository,
  MembershipRepository,
  Period,
} from "../../../application/ports/repositories.js";
import type { Category } from "../../../domain/category.js";
import type { Expense } from "../../../domain/expense.js";
import type { Household } from "../../../domain/household.js";
import type { Membership } from "../../../domain/membership.js";
import { isMembershipActiveOn } from "../../../domain/membership.js";
import type { CategoryParticipationChangeRequest } from "../../../domain/participation-request.js";
import { isApprovedTemporaryExclusionActiveOn } from "../../../domain/participation-request.js";
import type { MemberCategoryPreference } from "../../../domain/preferences.js";
import { isPreferenceValidOn } from "../../../domain/preferences.js";
import type { InMemoryStore } from "./in-memory-store.js";

export class InMemoryHouseholdRepository implements HouseholdRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findById(householdId: string) {
    return this.store.households.get(householdId) ?? null;
  }

  async save(household: Household): Promise<void> {
    this.store.households.set(household.id, household);
  }
}

export class InMemoryMembershipRepository implements MembershipRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findById(membershipId: string) {
    return this.store.memberships.get(membershipId) ?? null;
  }

  async listActiveByHouseholdOnDate(householdId: string, date: Date) {
    return [...this.store.memberships.values()].filter(
      (membership) => membership.householdId === householdId && isMembershipActiveOn(membership, date),
    );
  }

  async save(membership: Membership): Promise<void> {
    this.store.memberships.set(membership.id, membership);
  }
}

export class InMemoryCategoryRepository implements CategoryRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findById(categoryId: string) {
    return this.store.categories.get(categoryId) ?? null;
  }

  async save(category: Category): Promise<void> {
    this.store.categories.set(category.id, category);
  }
}

export class InMemoryMemberCategoryPreferenceRepository
  implements MemberCategoryPreferenceRepository
{
  constructor(private readonly store: InMemoryStore) {}

  async listByHouseholdCategoryOnDate(householdId: string, categoryId: string, date: Date) {
    return [...this.store.preferences.values()].filter(
      (preference) =>
        preference.householdId === householdId &&
        preference.categoryId === categoryId &&
        isPreferenceValidOn(preference, date),
    );
  }

  async save(preference: MemberCategoryPreference): Promise<void> {
    this.store.preferences.set(preference.id, preference);
  }
}

export class InMemoryCategoryParticipationChangeRequestRepository
  implements CategoryParticipationChangeRequestRepository
{
  constructor(private readonly store: InMemoryStore) {}

  async listApprovedTemporaryExclusionsOnDate(householdId: string, categoryId: string, date: Date) {
    return [...this.store.participationRequests.values()].filter(
      (request) =>
        request.householdId === householdId &&
        request.categoryId === categoryId &&
        isApprovedTemporaryExclusionActiveOn(request, date),
    );
  }

  async save(request: CategoryParticipationChangeRequest): Promise<void> {
    this.store.participationRequests.set(request.id, request);
  }
}

export class InMemoryExpenseRepository implements ExpenseRepository {
  constructor(private readonly store: InMemoryStore) {}

  async save(expense: Expense): Promise<void> {
    this.store.expenses.set(expense.id, expense);
  }

  async listByHouseholdAndPeriod(
    householdId: string,
    period: Period,
    params?: {
      categoryId?: string;
      status?: "ACTIVE" | "CANCELLED";
      limit?: number;
      cursor?: string;
    },
  ) {
    const records = [...this.store.expenses.values()]
      .filter(
        (expense) =>
          expense.householdId === householdId &&
          expense.date >= period.from &&
          expense.date < period.to &&
          (params?.categoryId ? expense.categoryId === params.categoryId : true) &&
          (params?.status ? expense.status === params.status : true),
      )
      .sort((a, b) => {
        const dateDiff = b.date.getTime() - a.date.getTime();
        if (dateDiff !== 0) {
          return dateDiff;
        }
        return b.id.localeCompare(a.id);
      });

    if (!params?.cursor && !params?.limit) {
      return records;
    }

    const startIndex = params.cursor
      ? Math.max(
          0,
          records.findIndex((item) => item.id === params.cursor) + 1,
        )
      : 0;

    const limit = params.limit ?? 50;
    return records.slice(startIndex, startIndex + limit);
  }
}

export class InMemoryHouseholdBalanceReadModel implements HouseholdBalanceReadModel {
  constructor(private readonly store: InMemoryStore) {}

  async getBalance(householdId: string, period: Period): Promise<HouseholdBalanceRow[]> {
    const expenses = [...this.store.expenses.values()].filter(
      (expense) =>
        expense.householdId === householdId &&
        expense.status === "ACTIVE" &&
        expense.date >= period.from &&
        expense.date < period.to,
    );

    const byMember = new Map<string, { paid: number; assigned: number }>();

    for (const expense of expenses) {
      const payer = byMember.get(expense.payerMembershipId) ?? { paid: 0, assigned: 0 };
      payer.paid += expense.totalAmount;
      byMember.set(expense.payerMembershipId, payer);

      for (const share of expense.split.shares) {
        const assignee = byMember.get(share.membershipId) ?? { paid: 0, assigned: 0 };
        assignee.assigned += share.assignedAmount;
        byMember.set(share.membershipId, assignee);
      }
    }

    return [...byMember.entries()].map(([membershipId, values]) => ({
      membershipId,
      paid: values.paid,
      assigned: values.assigned,
      netBalance: values.paid - values.assigned,
    }));
  }
}
