import type { Expense, ExpenseItem, ExpenseShare } from "../../domain/expense.js";
import { isApprovedTemporaryExclusionActiveOn } from "../../domain/participation-request.js";
import { isPreferenceValidOn } from "../../domain/preferences.js";
import { WeightedSplitCalculator } from "../../domain/services/weighted-split-calculator.js";
import { NotFoundError, ValidationError } from "../errors.js";
import type {
  CategoryParticipationChangeRequestRepository,
  CategoryRepository,
  ExpenseRepository,
  HouseholdRepository,
  MemberCategoryPreferenceRepository,
  MembershipRepository,
} from "../ports/repositories.js";
import type { Clock, IdGenerator } from "../ports/services.js";

export interface RegisterExpenseItemInput {
  description: string;
  quantity?: number;
  unit?: string;
  note?: string;
}

export interface RegisterExpenseManualShareInput {
  membershipId: string;
  assignedAmount: number;
}

export type RegisterExpenseSplitInput =
  | {
      mode: "AUTO_WEIGHTED";
    }
  | {
      mode: "MANUAL";
      shares: RegisterExpenseManualShareInput[];
    };

export interface RegisterExpenseInput {
  householdId: string;
  categoryId: string;
  payerMembershipId: string;
  date: string;
  totalAmount: number;
  note?: string;
  items?: RegisterExpenseItemInput[];
  split: RegisterExpenseSplitInput;
  actorMembershipId: string;
}

export interface RegisterExpenseResult {
  expense: Expense;
}

interface RegisterExpenseDependencies {
  householdRepository: HouseholdRepository;
  membershipRepository: MembershipRepository;
  categoryRepository: CategoryRepository;
  memberCategoryPreferenceRepository: MemberCategoryPreferenceRepository;
  participationChangeRequestRepository: CategoryParticipationChangeRequestRepository;
  expenseRepository: ExpenseRepository;
  weightedSplitCalculator: WeightedSplitCalculator;
  idGenerator: IdGenerator;
  clock: Clock;
}

interface ResolvedParticipant {
  membershipId: string;
  weight: number;
}

export class RegisterExpenseUseCase {
  constructor(private readonly deps: RegisterExpenseDependencies) {}

  async execute(input: RegisterExpenseInput): Promise<RegisterExpenseResult> {
    this.validateBaseInput(input);

    const expenseDate = parseIsoDate(input.date, "date");
    const household = await this.deps.householdRepository.findById(input.householdId);
    if (!household) {
      throw new NotFoundError("household not found");
    }

    const category = await this.deps.categoryRepository.findById(input.categoryId);
    if (!category || category.householdId !== input.householdId || category.status !== "ACTIVE") {
      throw new NotFoundError("category not found or inactive for household");
    }

    const activeMemberships = await this.deps.membershipRepository.listActiveByHouseholdOnDate(
      input.householdId,
      expenseDate,
    );

    const activeMembershipIds = new Set(activeMemberships.map((membership) => membership.id));

    if (!activeMembershipIds.has(input.payerMembershipId)) {
      throw new ValidationError("payerMembershipId is not active on expense date");
    }

    if (!activeMembershipIds.has(input.actorMembershipId)) {
      throw new ValidationError("actorMembershipId is not active on expense date");
    }

    const splitShares =
      input.split.mode === "AUTO_WEIGHTED"
        ? await this.resolveAutoWeightedShares(input.householdId, input.categoryId, expenseDate, input.totalAmount)
        : this.resolveManualShares(input.totalAmount, activeMembershipIds, input.split.shares);

    const normalizedItems = this.normalizeItems(input.items ?? []);
    const now = this.deps.clock.now();
    const note = input.note?.trim();

    const expense: Expense = {
      id: this.deps.idGenerator.next("exp"),
      householdId: household.id,
      categoryId: category.id,
      payerMembershipId: input.payerMembershipId,
      date: expenseDate,
      totalAmount: input.totalAmount,
      status: "ACTIVE",
      items: normalizedItems,
      split: {
        mode: input.split.mode,
        shares: splitShares,
      },
      audit: {
        createdByMembershipId: input.actorMembershipId,
        createdAt: now,
        updatedAt: now,
      },
      ...(note ? { note } : {}),
    };

    await this.deps.expenseRepository.save(expense);

    return { expense };
  }

  private async resolveAutoWeightedShares(
    householdId: string,
    categoryId: string,
    expenseDate: Date,
    totalAmount: number,
  ): Promise<ExpenseShare[]> {
    const activeMemberships = await this.deps.membershipRepository.listActiveByHouseholdOnDate(
      householdId,
      expenseDate,
    );

    const byMembership = new Map<string, ResolvedParticipant>(
      activeMemberships.map((membership) => [
        membership.id,
        {
          membershipId: membership.id,
          weight: 1,
        },
      ]),
    );

    const preferences = await this.deps.memberCategoryPreferenceRepository.listByHouseholdCategoryOnDate(
      householdId,
      categoryId,
      expenseDate,
    );

    for (const preference of preferences) {
      if (!isPreferenceValidOn(preference, expenseDate)) {
        continue;
      }

      if (!byMembership.has(preference.membershipId)) {
        continue;
      }

      if (preference.mode === "EXCLUDE_DEFAULT") {
        byMembership.delete(preference.membershipId);
        continue;
      }

      byMembership.set(preference.membershipId, {
        membershipId: preference.membershipId,
        weight: preference.weight,
      });
    }

    const approvedExclusions =
      await this.deps.participationChangeRequestRepository.listApprovedTemporaryExclusionsOnDate(
        householdId,
        categoryId,
        expenseDate,
      );

    for (const exclusion of approvedExclusions) {
      if (isApprovedTemporaryExclusionActiveOn(exclusion, expenseDate)) {
        byMembership.delete(exclusion.membershipId);
      }
    }

    const participants = [...byMembership.values()].sort((a, b) => a.membershipId.localeCompare(b.membershipId));

    if (participants.length === 0) {
      throw new ValidationError("AUTO_WEIGHTED split needs at least one participant");
    }

    const shares = this.deps.weightedSplitCalculator.calculate(totalAmount, participants);
    this.assertTotalMatches(totalAmount, shares);
    return shares;
  }

  private resolveManualShares(
    totalAmount: number,
    activeMembershipIds: Set<string>,
    manualShares: RegisterExpenseManualShareInput[],
  ): ExpenseShare[] {
    if (manualShares.length === 0) {
      throw new ValidationError("MANUAL split needs at least one share");
    }

    const uniqueMembers = new Set<string>();
    let assignedTotal = 0;

    for (const share of manualShares) {
      if (!activeMembershipIds.has(share.membershipId)) {
        throw new ValidationError(`manual share membership is not active: ${share.membershipId}`);
      }

      if (uniqueMembers.has(share.membershipId)) {
        throw new ValidationError(`duplicated manual share membership: ${share.membershipId}`);
      }

      if (!Number.isInteger(share.assignedAmount) || share.assignedAmount < 0) {
        throw new ValidationError("manual assignedAmount must be integer >= 0");
      }

      uniqueMembers.add(share.membershipId);
      assignedTotal += share.assignedAmount;
    }

    if (assignedTotal !== totalAmount) {
      throw new ValidationError("manual shares must sum exactly totalAmount");
    }

    return manualShares.map((share) => ({
      membershipId: share.membershipId,
      assignedAmount: share.assignedAmount,
    }));
  }

  private normalizeItems(items: RegisterExpenseItemInput[]): ExpenseItem[] {
    return items.map((item, index) => {
      const description = item.description?.trim();
      if (!description) {
        throw new ValidationError(`items[${index}].description is required`);
      }

      if (
        item.quantity !== undefined &&
        (!Number.isFinite(item.quantity) || item.quantity <= 0)
      ) {
        throw new ValidationError(`items[${index}].quantity must be > 0 when provided`);
      }

      const unit = item.unit?.trim();
      const note = item.note?.trim();

      return {
        description,
        ...(item.quantity !== undefined ? { quantity: item.quantity } : {}),
        ...(unit ? { unit } : {}),
        ...(note ? { note } : {}),
      };
    });
  }

  private validateBaseInput(input: RegisterExpenseInput): void {
    if (!input.householdId) {
      throw new ValidationError("householdId is required");
    }

    if (!input.categoryId) {
      throw new ValidationError("categoryId is required");
    }

    if (!input.payerMembershipId) {
      throw new ValidationError("payerMembershipId is required");
    }

    if (!input.actorMembershipId) {
      throw new ValidationError("actorMembershipId is required");
    }

    if (!Number.isInteger(input.totalAmount) || input.totalAmount <= 0) {
      throw new ValidationError("totalAmount must be a positive integer in CLP");
    }
  }

  private assertTotalMatches(totalAmount: number, shares: ExpenseShare[]): void {
    const totalAssigned = shares.reduce((acc, share) => acc + share.assignedAmount, 0);
    if (totalAssigned !== totalAmount) {
      throw new ValidationError("calculated shares do not sum totalAmount");
    }
  }
}

const parseIsoDate = (value: string, label: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${label} must be a valid ISO date`);
  }
  return parsed;
};
