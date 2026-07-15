import { apiRequest } from "@/lib/api";
import type {
  Balance,
  Category,
  Expense as ExpenseDto,
  ExpenseDraft,
  ExpensePaymentDraft,
  Member,
  MonthlySettlement,
  ParticipationRules,
  PreferenceDraft,
} from "@/lib/domain";
import type { RequestContext } from "@/data-access/core/types";
import type {
  DistributionRule,
  ExpenseCategory,
  ExpenseMember,
  Expense as ExpenseEntity,
  ExpenseWorkspaceViewModel,
  MonthlySettlement as ExpenseMonthlySettlement,
} from "../domain";
import { buildExpenseWorkspaceViewModel } from "../application";
import { normalizeMonth } from "../domain";

export interface ExpensesRepository {
  listExpenses(householdId: string, from: string, to: string, context?: RequestContext): Promise<ExpenseEntity[]>;
  createExpense(
    householdId: string,
    draft: ExpenseDraft & { payerMembershipId: string; actorMembershipId: string },
    context?: RequestContext,
  ): Promise<ExpenseEntity>;
  registerPayment(
    householdId: string,
    expenseId: string,
    payment: ExpensePaymentDraft & { createdByMembershipId: string },
    context?: RequestContext,
  ): Promise<ExpenseEntity>;
}

export interface RulesRepository {
  listCategories(householdId: string, context?: RequestContext): Promise<ExpenseCategory[]>;
  createCategory(
    householdId: string,
    name: string,
    createdByMembershipId: string,
    context?: RequestContext,
  ): Promise<ExpenseCategory>;
  listRules(householdId: string, on: string, context?: RequestContext): Promise<DistributionRule[]>;
  upsertRule(
    householdId: string,
    rule: PreferenceDraft & { changedByMembershipId: string },
    context?: RequestContext,
  ): Promise<DistributionRule>;
}

export interface SettlementRepository {
  monthlySettlement(
    householdId: string,
    month: string,
    context?: RequestContext,
  ): Promise<ExpenseMonthlySettlement>;
  balance(householdId: string, from: string, to: string, context?: RequestContext): Promise<Balance>;
}

export interface ExpenseDataGateway {
  members: {
    list(householdId: string, context?: RequestContext): Promise<ExpenseMember[]>;
  };
  rules: RulesRepository;
  expenses: ExpensesRepository;
  settlement: SettlementRepository;
}

export function createExpenseHttpGateway(): ExpenseDataGateway {
  return {
    members: {
      async list(householdId, context) {
        const response = await apiRequest<{ memberships: Member[] }>(
          `/api/v1/households/${householdId}/memberships`,
          { accessToken: context?.accessToken },
        );
        return response.memberships.map(mapMemberToExpenseMember);
      },
    },
    rules: {
      async listCategories(householdId, context) {
        const response = await apiRequest<{ categories: Category[] }>(
          `/api/v1/households/${householdId}/categories`,
          { accessToken: context?.accessToken },
        );
        return response.categories.map(mapCategoryToExpenseCategory);
      },
      async createCategory(householdId, name, createdByMembershipId, context) {
        const response = await apiRequest<Category>(`/api/v1/households/${householdId}/categories`, {
          method: "POST",
          accessToken: context?.accessToken,
          body: JSON.stringify({ name, createdByMembershipId }),
        });
        return mapCategoryToExpenseCategory(response);
      },
      async listRules(householdId, on, context) {
        const response = await apiRequest<ParticipationRules>(
          `/api/v1/households/${householdId}/participation-rules?on=${on}`,
          { accessToken: context?.accessToken },
        );
        return response.preferences.map(mapPreferenceToRule);
      },
      async upsertRule(householdId, rule, context) {
        const response = await apiRequest<ParticipationRules>(
          `/api/v1/households/${householdId}/categories/${rule.categoryId}/preferences/${rule.membershipId}`,
          {
            method: "PUT",
            accessToken: context?.accessToken,
            body: JSON.stringify({
              mode: rule.mode,
              ...(rule.weight !== undefined ? { weight: rule.weight } : {}),
              validFrom: rule.validFrom,
              validTo: rule.validTo,
              changedByMembershipId: rule.changedByMembershipId,
            }),
          },
        );
        const updated = response.preferences.find(
          (item) => item.categoryId === rule.categoryId && item.membershipId === rule.membershipId,
        );
        if (!updated) throw new Error("No encontramos la regla guardada.");
        return mapPreferenceToRule(updated);
      },
    },
    expenses: {
      async listExpenses(householdId, from, to, context) {
        const response = await apiRequest<{ expenses: ExpenseDto[] }>(
          `/api/v1/households/${householdId}/expenses?from=${from}&to=${to}&limit=200`,
          { accessToken: context?.accessToken },
        );
        return response.expenses.map(mapExpenseDtoToEntity);
      },
      async createExpense(householdId, draft, context) {
        const response = await apiRequest<ExpenseDto>(`/api/v1/households/${householdId}/expenses`, {
          method: "POST",
          accessToken: context?.accessToken,
          body: JSON.stringify({
            ...draft,
            split: { mode: "AUTO_WEIGHTED" },
          }),
        });
        return mapExpenseDtoToEntity(response);
      },
      async registerPayment(householdId, expenseId, payment, context) {
        const response = await apiRequest<ExpenseDto>(`/api/v1/households/${householdId}/expenses/${expenseId}/payments`, {
          method: "POST",
          accessToken: context?.accessToken,
          body: JSON.stringify(payment),
        });
        return mapExpenseDtoToEntity(response);
      },
    },
    settlement: {
      async monthlySettlement(householdId, month, context) {
        const response = await apiRequest<MonthlySettlement>(
          `/api/v1/households/${householdId}/monthly-settlement?month=${month}`,
          { accessToken: context?.accessToken },
        );
        return mapSettlementDtoToEntity(response);
      },
      async balance(householdId, from, to, context) {
        return apiRequest<Balance>(`/api/v1/households/${householdId}/balance?from=${from}&to=${to}`, {
          accessToken: context?.accessToken,
        });
      },
    },
  };
}

export function createFakeExpenseGateway(seed: {
  members?: ExpenseMember[];
  categories?: ExpenseCategory[];
  rules?: DistributionRule[];
  expenses?: ExpenseEntity[];
  settlements?: ExpenseMonthlySettlement[];
  balances?: Balance[];
} = {}): ExpenseDataGateway {
  const store = {
    members: [...(seed.members ?? [])],
    categories: [...(seed.categories ?? [])],
    rules: [...(seed.rules ?? [])],
    expenses: [...(seed.expenses ?? [])],
    settlements: [...(seed.settlements ?? [])],
    balances: [...(seed.balances ?? [])],
  };

  return {
    members: {
      async list(householdId) {
        return store.members.filter((member) => member.householdId === householdId).map((member) => ({ ...member }));
      },
    },
    rules: {
      async listCategories(householdId) {
        return store.categories.filter((category) => category.householdId === householdId).map((category) => ({ ...category }));
      },
      async createCategory(householdId, name, createdByMembershipId) {
        const category: ExpenseCategory = {
          categoryId: `category-${store.categories.length + 1}`,
          householdId,
          name,
          status: "ACTIVE",
          createdByMembershipId,
          createdAt: new Date().toISOString(),
        };
        store.categories.push(category);
        return { ...category };
      },
      async listRules(householdId) {
        return store.rules.filter((rule) => rule.householdId === householdId).map((rule) => ({ ...rule }));
      },
      async upsertRule(householdId, rule) {
        const next: DistributionRule = {
          preferenceId: `rule-${store.rules.length + 1}`,
          householdId,
          categoryId: rule.categoryId,
          membershipId: rule.membershipId,
          mode: rule.mode,
          weight: rule.weight ?? 1,
          validFrom: rule.validFrom,
          validTo: rule.validTo,
          changedByMembershipId: rule.changedByMembershipId,
          changedAt: new Date().toISOString(),
        };
        const index = store.rules.findIndex(
          (item) => item.householdId === householdId && item.categoryId === rule.categoryId && item.membershipId === rule.membershipId,
        );
        if (index >= 0) {
          store.rules[index] = next;
        } else {
          store.rules.push(next);
        }
        return { ...next };
      },
    },
    expenses: {
      async listExpenses(householdId) {
        return store.expenses.filter((expense) => expense.householdId === householdId).map((expense) => ({ ...expense }));
      },
      async createExpense(householdId, draft) {
        const expense: ExpenseEntity = {
          expenseId: `expense-${store.expenses.length + 1}`,
          householdId,
          categoryId: draft.categoryId,
          payerMembershipId: draft.payerMembershipId,
          date: draft.date,
          totalAmount: draft.totalAmount,
          status: "ACTIVE",
          note: draft.note,
          split: { mode: "AUTO_WEIGHTED", shares: [] },
          audit: {
            createdByMembershipId: draft.actorMembershipId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
        store.expenses.push(expense);
        return { ...expense };
      },
      async registerPayment(householdId, expenseId, payment) {
        const expense = store.expenses.find(
          (item) => item.householdId === householdId && item.expenseId === expenseId,
        );
        if (!expense) throw new Error("Expense not found.");
        const currentSettlement = expense.settlement ?? { payments: [], shares: expense.split.shares };
        const paymentNumber = currentSettlement.payments.length + 1;
        const nextPayment = {
          paymentId: `payment-${paymentNumber}`,
          householdId,
          expenseId,
          membershipId: payment.membershipId,
          amount: payment.amount,
          createdByMembershipId: payment.createdByMembershipId,
          createdAt: new Date().toISOString(),
        };
        const nextPayments = [...currentSettlement.payments, nextPayment];
        const nextShares = currentSettlement.shares.map((share) => {
          if (share.membershipId !== payment.membershipId) return { ...share };
          const paidAmount = share.paidAmount + payment.amount;
          const remainingAmount = Math.max(share.assignedAmount - paidAmount, 0);
          const status =
            remainingAmount === 0 ? ("PAID" as const) : paidAmount > 0 ? ("PARTIAL" as const) : ("PENDING" as const);
          return {
            ...share,
            paidAmount,
            remainingAmount,
            status,
          };
        });
        expense.settlement = { payments: nextPayments, shares: nextShares };
        expense.split = { ...expense.split, shares: nextShares };
        expense.audit.updatedAt = new Date().toISOString();
        return { ...expense, settlement: expense.settlement };
      },
    },
    settlement: {
      async monthlySettlement(householdId, month) {
        const settlement = store.settlements.find(
          (item) => item.householdId === householdId && item.month === month,
        );
        if (!settlement) {
          throw new Error("Settlement not found.");
        }
        return { ...settlement, members: settlement.members.map((row) => ({ ...row })) };
      },
      async balance(_householdId) {
        void _householdId;
        const balance = store.balances.find((item) => item.members.some((member) => member.membershipId));
        if (!balance) {
          return { members: [] };
        }
        return {
          members: balance.members.map((member) => ({ ...member })),
        };
      },
    },
  };
}

export function buildExpenseWorkspaceViewModelFromGateway(input: {
  month: string;
  actor: { membershipId: string; role: "ADMIN" | "MEMBER" };
  members: ExpenseMember[];
  categories: ExpenseCategory[];
  expenses: ExpenseEntity[];
  settlement: ExpenseMonthlySettlement | null;
  rules: DistributionRule[];
}): ExpenseWorkspaceViewModel {
  return buildExpenseWorkspaceViewModel({
    month: normalizeMonth(input.month),
    actor: input.actor,
    members: input.members,
    categories: input.categories,
    expenses: input.expenses,
    settlement: input.settlement,
    rules: input.rules,
  });
}

function mapMemberToExpenseMember(member: Member): ExpenseMember {
  return {
    membershipId: member.membershipId,
    householdId: member.householdId,
    displayName: member.userName ?? member.userId,
    role: member.role,
    status: "ACTIVE",
    livingSince: member.livingSince,
  };
}

function mapCategoryToExpenseCategory(category: Category): ExpenseCategory {
  return {
    categoryId: category.categoryId,
    householdId: category.householdId ?? "",
    name: category.name,
    status: "ACTIVE",
    createdByMembershipId: "",
    createdAt: new Date().toISOString(),
  };
}

function mapPreferenceToRule(preference: ParticipationRules["preferences"][number]): DistributionRule {
  return {
    preferenceId: preference.preferenceId,
    householdId: "",
    categoryId: preference.categoryId,
    membershipId: preference.membershipId,
    mode: preference.mode,
    weight: preference.weight,
    validFrom: preference.validFrom,
    validTo: preference.validTo,
    changedByMembershipId: "",
    changedAt: new Date().toISOString(),
  };
}

function mapExpenseDtoToEntity(dto: ExpenseDto): ExpenseEntity {
  return {
    expenseId: dto.expenseId,
    householdId: dto.householdId,
    categoryId: dto.categoryId,
    payerMembershipId: dto.payerMembershipId,
    date: dto.date,
    totalAmount: dto.totalAmount,
    status: dto.status,
    note: dto.note,
    split: {
      mode: dto.split.mode,
      shares: dto.split.shares.map((share) => ({
        membershipId: share.membershipId,
        displayName: share.membershipId,
        assignedAmount: share.assignedAmount,
        weightUsed: share.weightUsed ?? 1,
        paidAmount: share.paidAmount,
        remainingAmount: share.remainingAmount,
        status: share.status,
        presenceDays: 0,
        absenceDays: 0,
        ruleMode: "INCLUDE_DEFAULT",
        explanation: "",
      })),
    },
    settlement: dto.settlement
      ? {
          payments: dto.settlement.payments.map((payment) => ({ ...payment })),
          shares: dto.settlement.shares.map((share) => ({
            membershipId: share.membershipId,
            displayName: share.membershipId,
            assignedAmount: share.assignedAmount,
            weightUsed: share.weightUsed ?? 1,
            paidAmount: share.paidAmount,
            remainingAmount: share.remainingAmount,
            status: share.status,
            presenceDays: 0,
            absenceDays: 0,
            ruleMode: "INCLUDE_DEFAULT",
            explanation: "",
          })),
        }
      : undefined,
    audit: {
      createdByMembershipId: dto.audit.createdByMembershipId,
      createdAt: dto.audit.createdAt,
      updatedAt: dto.audit.updatedAt,
    },
  };
}

function mapSettlementDtoToEntity(dto: MonthlySettlement): ExpenseMonthlySettlement {
  return {
    householdId: dto.householdId,
    month: dto.month,
    totalAmount: dto.totalAmount,
    daysInMonth: dto.daysInMonth,
    totalMemberDays: dto.totalMemberDays,
    totalAbsenceDays: dto.totalAbsenceDays,
    totalPresenceDays: dto.totalPresenceDays,
    dailyAmount: dto.dailyAmount,
    members: dto.members.map((row) => ({
      membershipId: row.membershipId,
      displayName: (row as { displayName?: string }).displayName ?? row.membershipId,
      memberDays: row.memberDays,
      absenceDays: row.absenceDays,
      presenceDays: row.presenceDays,
      assignedAmount: row.assignedAmount,
    })),
  };
}
