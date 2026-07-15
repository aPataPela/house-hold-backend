import type {
  DistributionRule,
  Expense,
  ExpenseCategory,
  ExpenseDraft,
  ExpenseMember,
  ExpensePaymentDraft,
  ExpensePreview,
  ExpenseWorkspaceViewModel,
  MonthlySettlement,
  MonthlySettlementViewModel,
} from "../domain";
import {
  buildExpenseListItemViewModel,
  buildMonthlySettlementViewModel,
  createExpenseDistributionPolicy,
  normalizeDate,
  normalizeMonth,
} from "../domain";

export type ExpenseApplicationErrorCode =
  | "FORBIDDEN"
  | "INVALID_AMOUNT"
  | "INVALID_PERIOD"
  | "NOT_FOUND"
  | "NO_ELIGIBLE_MEMBERS"
  | "UNKNOWN";

export class ExpenseApplicationError extends Error {
  constructor(
    public readonly code: ExpenseApplicationErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ExpenseApplicationError";
  }
}

export interface ExpenseActor {
  membershipId: string;
  role: "ADMIN" | "MEMBER";
}

export interface ExpensePageInput {
  actor: ExpenseActor;
  month: string;
  members: ExpenseMember[];
  categories: ExpenseCategory[];
  expenses: Expense[];
  settlement: MonthlySettlement | null;
  rules: DistributionRule[];
}

export interface ExpensePreviewInput {
  actor: ExpenseActor;
  draft: ExpenseDraft;
  members: ExpenseMember[];
  categories: ExpenseCategory[];
  settlement: MonthlySettlement | null;
  rules: DistributionRule[];
}

export interface CreateExpenseInput extends ExpensePreviewInput {
  payerMembershipId: string;
}

export interface RegisterPaymentInput {
  expenseId: string;
  payment: ExpensePaymentDraft;
  expenses: Expense[];
}

export interface DistributionRuleInput {
  categoryId: string;
  membershipId: string;
  mode: "PARTICIPATES" | "HALF" | "NO_PARTICIPATES" | "INCLUDE_DEFAULT" | "EXCLUDE_DEFAULT";
  weight?: number;
  validFrom: string;
  validTo: string | null;
  changedByMembershipId: string;
}

export function buildExpenseWorkspaceViewModel(input: ExpensePageInput): ExpenseWorkspaceViewModel {
  const preview = buildExpensePreviewViewModel({
    actor: input.actor,
    draft: {
      categoryId: input.categories[0]?.categoryId ?? "",
      date: `${normalizeMonth(input.month)}-01`,
      totalAmount: 0,
    },
    members: input.members,
    categories: input.categories,
    settlement: input.settlement,
    rules: input.rules,
  });

  return {
    month: normalizeMonth(input.month),
    categories: input.categories.map((category) => ({
      categoryId: category.categoryId,
      label: category.name,
    })),
    members: input.members.map((member) => ({
      membershipId: member.membershipId,
      label: member.displayName,
      available: member.status === "ACTIVE",
    })),
    preview,
    expenses: input.expenses.map((expense) =>
      buildExpenseListItemViewModel(
        expense,
        (membershipId) =>
          input.members.find((member) => member.membershipId === membershipId)?.displayName ??
          membershipId,
        (categoryId) =>
          input.categories.find((category) => category.categoryId === categoryId)?.name ?? "Gasto",
      ),
    ),
    settlement: buildMonthlySettlementViewModel(input.settlement),
    emptyState: input.expenses.length === 0,
    canRegisterPayments: input.expenses.some((expense) => expense.status === "ACTIVE"),
  };
}

export function buildExpensePreviewViewModel(input: ExpensePreviewInput): ExpensePreview {
  if (input.draft.totalAmount <= 0) {
    return {
      categoryId: input.draft.categoryId,
      categoryName:
        input.categories.find((category) => category.categoryId === input.draft.categoryId)?.name ??
        "Gasto",
      month: normalizeMonth(input.draft.date),
      totalAmount: 0,
      totalWeight: 0,
      rows: [],
      exclusions: [],
    };
  }

  const policy = createExpenseDistributionPolicy();
  return policy.preview({
    category:
      input.categories.find((category) => category.categoryId === input.draft.categoryId) ?? null,
    members: input.members,
    rules: input.rules,
    settlement: input.settlement,
    draft: input.draft,
  });
}

export function createExpenseUseCase(dependencies: {
  preview: (input: ExpensePreviewInput) => ExpensePreview;
  createExpense: (input: CreateExpenseInput) => Promise<Expense>;
}) {
  return async function execute(input: CreateExpenseInput): Promise<{
    expense: Expense;
    preview: ExpensePreview;
  }> {
    if (input.draft.totalAmount <= 0) {
      throw new ExpenseApplicationError("INVALID_AMOUNT", "El monto debe ser mayor a cero.");
    }
    if (normalizeDate(input.draft.date).length !== 10) {
      throw new ExpenseApplicationError("INVALID_PERIOD", "La fecha del gasto no es válida.");
    }
    if (!input.categories.some((category) => category.categoryId === input.draft.categoryId)) {
      throw new ExpenseApplicationError("NOT_FOUND", "La categoría seleccionada no existe.");
    }
    if (!input.members.some((member) => member.membershipId === input.payerMembershipId)) {
      throw new ExpenseApplicationError("NOT_FOUND", "La persona pagadora no existe.");
    }

    const preview = dependencies.preview(input);
    if (preview.rows.length === 0) {
      throw new ExpenseApplicationError(
        "NO_ELIGIBLE_MEMBERS",
        "No hay integrantes elegibles para repartir este gasto.",
        preview.exclusions,
      );
    }

    const expense = await dependencies.createExpense(input);
    return { expense, preview };
  };
}

export function createRegisterPaymentUseCase(dependencies: {
  registerPayment: (expenseId: string, payment: ExpensePaymentDraft) => Promise<Expense>;
}) {
  return async function execute(input: RegisterPaymentInput): Promise<Expense> {
    const expense = input.expenses.find((item) => item.expenseId === input.expenseId);
    if (!expense) {
      throw new ExpenseApplicationError("NOT_FOUND", "No encontramos el gasto a pagar.");
    }

    const share = expense.settlement?.shares.find(
      (item) => item.membershipId === input.payment.membershipId,
    );
    if (!share) {
      throw new ExpenseApplicationError("NOT_FOUND", "No encontramos el saldo de esa persona.");
    }
    if (input.payment.amount <= 0 || input.payment.amount > share.remainingAmount) {
      throw new ExpenseApplicationError("INVALID_AMOUNT", "El abono supera el saldo pendiente.");
    }

    return dependencies.registerPayment(input.expenseId, input.payment);
  };
}

export function buildMonthlySettlementUseCase(dependencies: {
  monthlySettlement: (month: string) => Promise<MonthlySettlement>;
}) {
  return async function execute(month: string): Promise<MonthlySettlementViewModel> {
    const settlement = await dependencies.monthlySettlement(month);
    const viewModel = buildMonthlySettlementViewModel(settlement);
    if (!viewModel) {
      throw new ExpenseApplicationError("NOT_FOUND", "No encontramos la liquidación mensual.");
    }
    return viewModel;
  };
}

export function createUpsertDistributionRuleUseCase(dependencies: {
  upsertRule: (input: DistributionRuleInput) => Promise<DistributionRule>;
}) {
  return async function execute(input: DistributionRuleInput): Promise<DistributionRule> {
    if (input.weight !== undefined && input.weight < 0) {
      throw new ExpenseApplicationError("INVALID_AMOUNT", "El peso de la regla no puede ser negativo.");
    }
    if (normalizeDate(input.validTo ?? input.validFrom) < normalizeDate(input.validFrom)) {
      throw new ExpenseApplicationError("INVALID_PERIOD", "La regla tiene un período inválido.");
    }
    return dependencies.upsertRule(input);
  };
}
