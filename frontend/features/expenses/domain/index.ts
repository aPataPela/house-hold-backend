export type Money = number;
export type ContributionWeight = number;

export type ExpenseMemberRole = "ADMIN" | "MEMBER";
export type ExpenseMemberStatus = "ACTIVE" | "INACTIVE";
export type ExpenseStatus = "ACTIVE" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID";
export type DistributionRuleMode =
  | "PARTICIPATES"
  | "HALF"
  | "NO_PARTICIPATES"
  | "INCLUDE_DEFAULT"
  | "EXCLUDE_DEFAULT";

export interface ExpenseMember {
  membershipId: string;
  householdId: string;
  displayName: string;
  role: ExpenseMemberRole;
  status: ExpenseMemberStatus;
  livingSince: string;
}

export interface ExpenseCategory {
  categoryId: string;
  householdId: string;
  name: string;
  status: "ACTIVE";
  createdByMembershipId: string;
  createdAt: string;
}

export interface DistributionRule {
  preferenceId: string;
  householdId: string;
  categoryId: string;
  membershipId: string;
  mode: DistributionRuleMode;
  weight: ContributionWeight;
  validFrom: string;
  validTo: string | null;
  changedByMembershipId: string;
  changedAt: string;
}

export interface ExpensePayment {
  paymentId: string;
  householdId: string;
  expenseId: string;
  membershipId: string;
  amount: Money;
  createdByMembershipId: string;
  createdAt: string;
}

export interface ExpenseSplitShare {
  membershipId: string;
  displayName?: string;
  assignedAmount: Money;
  weightUsed: ContributionWeight;
  paidAmount: Money;
  remainingAmount: Money;
  status: PaymentStatus;
  presenceDays: number;
  absenceDays: number;
  ruleMode: DistributionRuleMode;
  explanation: string;
}

export interface ExpenseSplit {
  mode: "AUTO_WEIGHTED" | "MANUAL";
  shares: ExpenseSplitShare[];
}

export interface ExpenseSettlement {
  payments: ExpensePayment[];
  shares: ExpenseSplitShare[];
}

export interface Expense {
  expenseId: string;
  householdId: string;
  categoryId: string;
  payerMembershipId: string;
  date: string;
  totalAmount: Money;
  status: ExpenseStatus;
  note?: string;
  split: ExpenseSplit;
  settlement?: ExpenseSettlement;
  audit: {
    createdByMembershipId: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ExpenseDraft {
  categoryId: string;
  date: string;
  totalAmount: Money;
  note?: string;
}

export interface ExpensePaymentDraft {
  membershipId: string;
  amount: Money;
}

export interface MonthlySettlementRow {
  membershipId: string;
  displayName?: string;
  memberDays: number;
  absenceDays: number;
  presenceDays: number;
  assignedAmount: Money;
}

export interface MonthlySettlement {
  householdId: string;
  month: string;
  totalAmount: Money;
  daysInMonth: number;
  totalMemberDays: number;
  totalAbsenceDays: number;
  totalPresenceDays: number;
  dailyAmount: Money;
  members: MonthlySettlementRow[];
}

export interface ExpenseRuleExplanation {
  membershipId: string;
  displayName: string;
  reason: string;
}

export interface ExpensePreviewRow {
  membershipId: string;
  displayName: string;
  presenceDays: number;
  absenceDays: number;
  ruleMode: DistributionRuleMode;
  weightUsed: ContributionWeight;
  effectiveWeight: ContributionWeight;
  assignedAmount: Money;
  explanation: string;
}

export interface ExpensePreviewConflict {
  membershipId: string;
  displayName: string;
  reason: string;
}

export interface ExpensePreview {
  categoryId: string;
  categoryName: string;
  month: string;
  totalAmount: Money;
  totalWeight: ContributionWeight;
  rows: ExpensePreviewRow[];
  exclusions: ExpensePreviewConflict[];
}

export interface ExpenseListItemViewModel {
  expenseId: string;
  categoryName: string;
  payerName: string;
  date: string;
  note?: string;
  totalAmountLabel: string;
  statusLabel: string;
  statusTone: "neutral" | "warning" | "success";
  currentShareLabel?: string;
}

export interface SettlementRowViewModel {
  membershipId: string;
  displayName: string;
  memberDays: number;
  presenceDays: number;
  absenceDays: number;
  assignedAmountLabel: string;
  presenceLabel: string;
  absenceLabel: string;
}

export interface MonthlySettlementViewModel {
  month: string;
  totalAmountLabel: string;
  dailyAmountLabel: string;
  totalPresenceDays: number;
  totalAbsenceDays: number;
  rows: SettlementRowViewModel[];
}

export interface ExpenseWorkspaceViewModel {
  month: string;
  categories: Array<{ categoryId: string; label: string }>;
  members: Array<{
    membershipId: string;
    label: string;
    available: boolean;
    reason?: string;
  }>;
  preview: ExpensePreview | null;
  expenses: ExpenseListItemViewModel[];
  settlement: MonthlySettlementViewModel | null;
  emptyState: boolean;
  canRegisterPayments: boolean;
}

function parseDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

export function normalizeDate(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value.slice(0, 10);
}

export function normalizeMonth(value: string | Date): string {
  if (value instanceof Date) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return value.slice(0, 7);
}

export function monthRange(month: string): { from: string; to: string } {
  const normalized = normalizeMonth(month);
  const [year, monthNumber] = normalized.split("-").map(Number);
  const from = `${normalized}-01`;
  const to = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
  return { from, to };
}

export function compareDates(a: string, b: string): number {
  return parseDate(a).getTime() - parseDate(b).getTime();
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetweenInclusive(from: string, to: string): number {
  return Math.floor((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000) + 1;
}

export function overlapDays(a: { start: string; end: string }, b: { start: string; end: string }): number {
  const start = compareDates(a.start, b.start) > 0 ? a.start : b.start;
  const end = compareDates(a.end, b.end) < 0 ? a.end : b.end;
  return compareDates(start, end) <= 0 ? daysBetweenInclusive(start, end) : 0;
}

export function createExpenseDistributionPolicy() {
  return {
    preview(input: {
      category: ExpenseCategory | null;
      members: ExpenseMember[];
      rules: DistributionRule[];
      settlement: MonthlySettlement | null;
      draft: ExpenseDraft;
    }): ExpensePreview {
      const categoryName = input.category?.name ?? "Gasto";
      const month = normalizeMonth(input.draft.date);
      const totalAmount = Math.max(0, Math.trunc(input.draft.totalAmount));
      const rows: ExpensePreviewRow[] = [];
      const exclusions: ExpensePreviewConflict[] = [];
      const settlementRows = new Map(
        input.settlement?.members.map((row) => [row.membershipId, row]) ?? [],
      );
      const activeRules = input.rules.filter(
        (rule) =>
          rule.categoryId === input.draft.categoryId &&
          compareDates(rule.validFrom, input.draft.date) <= 0 &&
          (!rule.validTo || compareDates(rule.validTo, input.draft.date) >= 0),
      );

      for (const member of input.members) {
        const settlementRow = settlementRows.get(member.membershipId);
        if (!settlementRow) {
          exclusions.push({
            membershipId: member.membershipId,
            displayName: member.displayName,
            reason: "Sin presencia mensual suficiente para repartir este gasto.",
          });
          continue;
        }

        if (member.status !== "ACTIVE") {
          exclusions.push({
            membershipId: member.membershipId,
            displayName: member.displayName,
            reason: "Integrante inactivo.",
          });
          continue;
        }

        const rule = activeRules.find((item) => item.membershipId === member.membershipId);
        const ruleMode = rule?.mode ?? "INCLUDE_DEFAULT";
        const weightUsed =
          ruleMode === "NO_PARTICIPATES" || ruleMode === "EXCLUDE_DEFAULT"
            ? 0
            : ruleMode === "HALF"
              ? 0.5
              : rule?.weight ?? 1;
        if (weightUsed <= 0) {
          exclusions.push({
            membershipId: member.membershipId,
            displayName: member.displayName,
            reason: "Excluido por regla de categoría.",
          });
          continue;
        }

        const presenceRatio =
          settlementRow.memberDays > 0 ? settlementRow.presenceDays / settlementRow.memberDays : 0;
        const effectiveWeight = Number((weightUsed * presenceRatio).toFixed(4));
        if (effectiveWeight <= 0) {
          exclusions.push({
            membershipId: member.membershipId,
            displayName: member.displayName,
            reason: "La presencia mensual fue insuficiente para participar.",
          });
          continue;
        }

        rows.push({
          membershipId: member.membershipId,
          displayName: member.displayName,
          presenceDays: settlementRow.presenceDays,
          absenceDays: settlementRow.absenceDays,
          ruleMode,
          weightUsed,
          effectiveWeight,
          assignedAmount: 0,
          explanation:
            ruleMode === "HALF"
              ? `Participa con media participación y ${settlementRow.presenceDays} días presentes.`
              : settlementRow.absenceDays > 0
                ? `Ajustado por presencia mensual: ${settlementRow.presenceDays} días presentes y ${settlementRow.absenceDays} días ausente.`
                : `Participa con presencia completa en el mes.`,
        });
      }

      const totalWeight = rows.reduce((sum, row) => sum + row.effectiveWeight, 0);
      let remainder = totalAmount;
      const withAmounts = rows.map((row, index) => {
        const amount =
          index === rows.length - 1
            ? remainder
            : totalWeight > 0
              ? Math.floor((totalAmount * row.effectiveWeight) / totalWeight)
              : 0;
        remainder -= amount;
        return { ...row, assignedAmount: amount };
      });

      return {
        categoryId: input.draft.categoryId,
        categoryName,
        month,
        totalAmount,
        totalWeight,
        rows: withAmounts,
        exclusions,
      };
    },
  };
}

export function buildMonthlySettlementViewModel(
  settlement: MonthlySettlement | null,
): MonthlySettlementViewModel | null {
  if (!settlement) return null;
  return {
    month: settlement.month,
    totalAmountLabel: formatMoney(settlement.totalAmount),
    dailyAmountLabel: formatMoney(settlement.dailyAmount),
    totalPresenceDays: settlement.totalPresenceDays,
    totalAbsenceDays: settlement.totalAbsenceDays,
    rows: settlement.members.map((row) => ({
      membershipId: row.membershipId,
      displayName: row.displayName ?? row.membershipId,
      memberDays: row.memberDays,
      presenceDays: row.presenceDays,
      absenceDays: row.absenceDays,
      assignedAmountLabel: formatMoney(row.assignedAmount),
      presenceLabel: `${row.presenceDays} días presentes`,
      absenceLabel: `${row.absenceDays} días ausente`,
    })),
  };
}

export function buildExpenseListItemViewModel(
  expense: Expense,
  memberName: (membershipId: string) => string,
  categoryName: (categoryId: string) => string,
): ExpenseListItemViewModel {
  const share = expense.settlement?.shares.find(
    (item) => item.membershipId === expense.payerMembershipId,
  );
  const statusLabel =
    share?.status === "PAID"
      ? "Pagado"
      : share?.status === "PARTIAL"
        ? "Parcial"
        : "Pendiente";
  const statusTone =
    share?.status === "PAID" ? "success" : share?.status === "PARTIAL" ? "warning" : "neutral";

  return {
    expenseId: expense.expenseId,
    categoryName: categoryName(expense.categoryId),
    payerName: memberName(expense.payerMembershipId),
    date: expense.date,
    note: expense.note,
    totalAmountLabel: formatMoney(expense.totalAmount),
    statusLabel,
    statusTone,
    ...(share
      ? {
          currentShareLabel:
            share.remainingAmount === 0
              ? `Tu saldo quedó en ${formatMoney(share.paidAmount)}`
              : `Quedan ${formatMoney(share.remainingAmount)} por pagar`,
        }
      : {}),
  };
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}
