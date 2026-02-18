import { NotFoundError, ValidationError } from "../errors.js";
import type { Expense } from "../../domain/expense.js";
import type { ExpenseRepository, HouseholdRepository } from "../ports/repositories.js";

export interface ListExpensesInput {
  householdId: string;
  from: string;
  to: string;
  categoryId?: string;
  status?: "ACTIVE" | "CANCELLED";
  limit?: number;
  cursor?: string;
}

export interface ListExpensesResult {
  expenses: Expense[];
  nextCursor?: string;
}

interface ListExpensesDependencies {
  householdRepository: HouseholdRepository;
  expenseRepository: ExpenseRepository;
}

export class ListExpensesUseCase {
  constructor(private readonly deps: ListExpensesDependencies) {}

  async execute(input: ListExpensesInput): Promise<ListExpensesResult> {
    const householdId = asRequiredTrimmed(input.householdId, "householdId");
    const from = parseIsoDate(input.from, "from");
    const to = parseIsoDate(input.to, "to");

    if (from >= to) {
      throw new ValidationError("from must be before to");
    }

    if (input.status && input.status !== "ACTIVE" && input.status !== "CANCELLED") {
      throw new ValidationError("status must be ACTIVE or CANCELLED");
    }

    if (input.limit !== undefined) {
      if (!Number.isInteger(input.limit) || input.limit <= 0 || input.limit > 200) {
        throw new ValidationError("limit must be an integer between 1 and 200");
      }
    }

    const household = await this.deps.householdRepository.findById(householdId);
    if (!household) {
      throw new NotFoundError("household not found");
    }

    const expenses = await this.deps.expenseRepository.listByHouseholdAndPeriod(
      household.id,
      { from, to },
      {
        status: input.status ?? "ACTIVE",
        ...(input.categoryId ? { categoryId: input.categoryId.trim() } : {}),
        ...(input.limit !== undefined ? { limit: input.limit } : {}),
        ...(input.cursor ? { cursor: input.cursor.trim() } : {}),
      },
    );

    const nextCursor =
      input.limit !== undefined && expenses.length === input.limit
        ? expenses[expenses.length - 1]?.id
        : undefined;

    return {
      expenses,
      ...(nextCursor ? { nextCursor } : {}),
    };
  }
}

const parseIsoDate = (value: string, field: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${field} must be a valid ISO date`);
  }

  return parsed;
};

const asRequiredTrimmed = (value: string, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`);
  }

  return value.trim();
};
