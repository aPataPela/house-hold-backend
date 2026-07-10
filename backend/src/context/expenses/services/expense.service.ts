import { randomUUID } from "node:crypto";
import type { Expense, ExpenseShare } from "../../shared/types/entities";
import { badRequest, notFound } from "../../shared/errors/app-error";
import { decodeExpenseCursor, encodeExpenseCursor } from "../../shared/utils/cursor";
import { parseDate, toDateString } from "../../shared/utils/date";
import { CategoryModel } from "../../households/models/category.model";
import { HouseholdModel } from "../../households/models/household.model";
import { MembershipModel } from "../../households/models/membership.model";
import { CategoryExclusionModel } from "../../participation/models/category-exclusion.model";
import { PreferenceModel } from "../../participation/models/preference.model";
import { ParticipationPolicyEngine } from "../../participation/services/participation-policy-engine";
import { ExpensePaymentModel } from "../models/expense-payment.model";
import { ExpenseModel } from "../models/expense.model";

const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const plain = <T>(doc: unknown): T => doc as T;

type ExpenseWithSettlement = Expense & {
  settlement: {
    payments: Array<{
      id: string;
      householdId: string;
      expenseId: string;
      membershipId: string;
      amount: number;
      createdByMembershipId: string;
      createdAt: Date;
    }>;
    shares: Array<{
      membershipId: string;
      assignedAmount: number;
      weightUsed?: number;
      paidAmount: number;
      remainingAmount: number;
      status: "PENDING" | "PARTIAL" | "PAID";
    }>;
  };
};

export class ExpenseService {
  constructor(
    private readonly now = () => new Date(),
    private readonly policyEngine = new ParticipationPolicyEngine(),
  ) {}

  async register(
    householdId: string,
    input: {
      categoryId: string;
      payerMembershipId: string;
      actorMembershipId: string;
      date: string;
      totalAmount: number;
      note?: string | undefined;
      items?: Expense["items"] | undefined;
      split: { mode: "AUTO_WEIGHTED"; shares?: never } | { mode: "MANUAL"; shares: ExpenseShare[] };
    },
  ) {
    if (!(await HouseholdModel.findById(householdId).lean())) throw notFound("household");
    const category = await CategoryModel.findById(input.categoryId).lean();
    if (!category || category.householdId !== householdId || category.status !== "ACTIVE") {
      throw notFound("category");
    }
    const date = parseDate(input.date, "date");
    if (!Number.isInteger(input.totalAmount) || input.totalAmount <= 0) {
      throw badRequest("INVALID_AMOUNT", "totalAmount must be a positive CLP integer");
    }
    const today = parseDate(toDateString(this.now()), "today");
    if (date > today) {
      throw badRequest("INVALID_DATE", "date cannot be in the future");
    }
    const payer = await this.findActiveMembership(householdId, input.payerMembershipId);
    if (!payer) {
      throw badRequest("INACTIVE_PAYER", "payer must be an active member");
    }
    const actor = await this.findActiveMembership(householdId, input.actorMembershipId);
    if (!actor) {
      throw badRequest("INACTIVE_ACTOR", "actor must be an active member");
    }
    const members = await this.listExpenseParticipants(householdId, date);
    const memberIds = new Set(members.map((member) => member.id));

    let shares: ExpenseShare[];
    if (input.split.mode === "MANUAL") {
      shares = input.split.shares;
      const uniqueMemberIds = new Set(shares.map((share) => share.membershipId));
      if (
        !shares.length ||
        uniqueMemberIds.size !== shares.length ||
        shares.some(
          (share) =>
            !memberIds.has(share.membershipId) ||
            !Number.isInteger(share.assignedAmount) ||
            share.assignedAmount < 0,
        )
      ) {
        throw badRequest(
          "INVALID_SHARES",
          "manual shares must reference active members and use non-negative integers",
        );
      }
      if (shares.reduce((sum, share) => sum + share.assignedAmount, 0) !== input.totalAmount) {
        throw badRequest("INVALID_SHARES_TOTAL", "manual shares must sum totalAmount");
      }
    } else {
      shares = this.policyEngine.calculateSplit(input.totalAmount, {
        members,
        preferences: await this.listPreferences(householdId, input.categoryId, date),
        exclusions: await this.listActiveExclusions(householdId, input.categoryId, date),
        date,
      });
    }

    const now = this.now();
    const expense: Expense = {
      id: id("exp"),
      householdId,
      categoryId: input.categoryId,
      payerMembershipId: input.payerMembershipId,
      date,
      totalAmount: input.totalAmount,
      status: "ACTIVE",
      items: input.items ?? [],
      split: { mode: input.split.mode, shares },
      audit: { createdByMembershipId: input.actorMembershipId, createdAt: now, updatedAt: now },
      ...(input.note ? { note: input.note.trim() } : {}),
    };
    await ExpenseModel.create({ ...expense, _id: expense.id });
    await this.settlePayerShare(expense, input.actorMembershipId);
    const nextSettlement = await this.loadSettlement(expense);
    return this.attachSettlement(expense, nextSettlement.payments, nextSettlement.shares);
  }

  async registerPayment(
    householdId: string,
    expenseId: string,
    input: { membershipId: string; amount: number; createdByMembershipId: string },
  ) {
    if (!(await HouseholdModel.findById(householdId).lean())) throw notFound("household");
    const expense = await this.findActiveExpense(householdId, expenseId);
    if (!expense) throw notFound("expense");
    const actor = await this.findActiveMembership(householdId, input.createdByMembershipId);
    if (!actor) throw badRequest("INACTIVE_ACTOR", "an active membership is required");
    if (actor.id !== input.membershipId && actor.role !== "ADMIN") {
      throw badRequest("INVALID_PAYMENT_MEMBER", "only an ADMIN can pay for another member");
    }
    if (!expense.split.shares.some((share) => share.membershipId === input.membershipId)) {
      throw badRequest("INVALID_PAYMENT_MEMBER", "membership is not part of the expense split");
    }
    const settlement = await this.loadSettlement(expense);
    const targetShare = settlement.shares.find((share) => share.membershipId === input.membershipId);
    if (!targetShare) throw notFound("expense share");
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw badRequest("INVALID_AMOUNT", "amount must be a positive CLP integer");
    }
    if (input.amount > targetShare.remainingAmount) {
      throw badRequest("OVERPAYMENT", "amount exceeds the remaining share balance");
    }
    const payment = {
      id: id("pay"),
      householdId,
      expenseId: expense.id,
      membershipId: input.membershipId,
      amount: input.amount,
      createdByMembershipId: actor.id,
      createdAt: this.now(),
    };
    await ExpensePaymentModel.create({ ...payment, _id: payment.id });
    const nextSettlement = await this.loadSettlement(expense);
    return this.attachSettlement(expense, nextSettlement.payments, nextSettlement.shares);
  }

  async list(
    householdId: string,
    input: {
      from: string;
      to: string;
      categoryId?: string | undefined;
      status?: "ACTIVE" | "CANCELLED" | undefined;
      limit?: number | undefined;
      cursor?: string | undefined;
    },
  ) {
    if (!(await HouseholdModel.findById(householdId).lean())) throw notFound("household");
    const from = parseDate(input.from, "from");
    const to = parseDate(input.to, "to");
    if (from >= to) throw badRequest("INVALID_PERIOD", "from must be before to");
    const limit = input.limit ?? 50;
    const expenses = await this.listExpenses({
      householdId,
      from,
      to,
      limit: limit + 1,
      ...(input.status ? { status: input.status } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.cursor ? { cursor: decodeExpenseCursor(input.cursor) } : {}),
    });
    const hasMore = expenses.length > limit;
    const page = expenses.slice(0, limit);
    const withSettlement = await this.attachSettlements(page);
    return {
      expenses: withSettlement,
      page: {
        limit,
        ...(hasMore && page.length ? { nextCursor: encodeExpenseCursor(page[page.length - 1]!) } : {}),
      },
    };
  }

  async balance(householdId: string, input: { from: string; to: string }) {
    if (!(await HouseholdModel.findById(householdId).lean())) throw notFound("household");
    const from = parseDate(input.from, "from");
    const to = parseDate(input.to, "to");
    if (from >= to) throw badRequest("INVALID_PERIOD", "from must be before to");
    const expenses = await this.listExpenses({ householdId, from, to, status: "ACTIVE" });
    const payments = await this.listPayments({
      householdId,
      from,
      to,
    });
    const paymentExpenseIds = [...new Set(payments.map((payment) => payment.expenseId))];
    const paymentExpenses =
      paymentExpenseIds.length > 0
        ? plain<Expense[]>(
            await ExpenseModel.find({
              householdId,
              _id: { $in: paymentExpenseIds },
              status: "ACTIVE",
            }).lean(),
          )
        : [];
    const paymentExpenseById = new Map(paymentExpenses.map((expense) => [expense.id, expense]));
    const periodMembers = await this.listActiveMemberships(householdId, new Date(to.getTime() - 1));
    const ids = new Set(periodMembers.map((member) => member.id));
    for (const expense of expenses) {
      ids.add(expense.payerMembershipId);
      expense.split.shares.forEach((share) => ids.add(share.membershipId));
    }
    for (const payment of payments) {
      ids.add(payment.membershipId);
      const expense = paymentExpenseById.get(payment.expenseId) ?? expenses.find((item) => item.id === payment.expenseId);
      if (expense) ids.add(expense.payerMembershipId);
    }
    const rows = new Map(
      [...ids].map((membershipId) => [membershipId, { membershipId, paid: 0, assigned: 0, netBalance: 0 }]),
    );
    for (const expense of expenses) {
      rows.get(expense.payerMembershipId)!.paid += expense.totalAmount;
      for (const share of expense.split.shares) {
        rows.get(share.membershipId)!.assigned += share.assignedAmount;
      }
    }
    for (const payment of payments) {
      const expense = paymentExpenseById.get(payment.expenseId) ?? expenses.find((item) => item.id === payment.expenseId);
      if (!expense) continue;
      rows.get(payment.membershipId)!.paid += payment.amount;
      rows.get(expense.payerMembershipId)!.assigned += payment.amount;
    }
    for (const row of rows.values()) row.netBalance = row.paid - row.assigned;
    return {
      householdId,
      period: { from: input.from, to: input.to },
      members: [...rows.values()].sort((a, b) => a.membershipId.localeCompare(b.membershipId)),
    };
  }

  private async listExpenseParticipants(householdId: string, date: Date) {
    const members = await this.listActiveMemberships(householdId, date);
    if (members.length > 0) return members;
    return this.listActiveMemberships(householdId, this.now());
  }

  private async listActiveMemberships(householdId: string, date: Date) {
    return plain<Array<{ id: string }>>(
      await MembershipModel.find({
        householdId,
        status: "ACTIVE",
        joinedAt: { $lte: date },
        $or: [{ leftAt: null }, { leftAt: { $gt: date } }, { leftAt: { $exists: false } }],
      })
        .sort({ _id: 1 })
      .lean(),
    );
  }

  private async findActiveMembership(householdId: string, membershipId: string, date = this.now()) {
    return plain<{ id: string; role: "ADMIN" | "MEMBER" } | null>(
      await MembershipModel.findOne({
        _id: membershipId,
        householdId,
        status: "ACTIVE",
        joinedAt: { $lte: date },
        $or: [{ leftAt: null }, { leftAt: { $gt: date } }, { leftAt: { $exists: false } }],
      }).lean(),
    );
  }

  private async listPreferences(householdId: string, categoryId: string, date: Date) {
    return plain<
      Array<{
        membershipId: string;
        mode:
          | "PARTICIPATES"
          | "HALF"
          | "NO_PARTICIPATES"
          | "INCLUDE_DEFAULT"
          | "EXCLUDE_DEFAULT";
        weight: number;
        validFrom: Date;
        validTo?: Date | null;
      }>
    >(
      await PreferenceModel.find({
        householdId,
        categoryId,
        validFrom: { $lte: date },
        $or: [{ validTo: null }, { validTo: { $gt: date } }, { validTo: { $exists: false } }],
      }).lean(),
    );
  }

  private async listActiveExclusions(householdId: string, categoryId: string, date: Date) {
    return plain<Array<{ membershipId: string; periodStart: Date; periodEnd: Date }>>(
      await CategoryExclusionModel.find({
        householdId,
        categoryId,
        status: "ACTIVE",
        periodStart: { $lte: date },
        periodEnd: { $gt: date },
      }).lean(),
    );
  }

  private async listExpenses(query: {
    householdId: string;
    from: Date;
    to: Date;
    status?: "ACTIVE" | "CANCELLED";
    categoryId?: string;
    limit?: number;
    cursor?: { date: Date; id: string };
  }) {
    const filter: Record<string, unknown> = {
      householdId: query.householdId,
      date: { $gte: query.from, $lt: query.to },
      status: query.status ?? "ACTIVE",
    };
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.cursor) {
      filter.$or = [
        { date: { $lt: query.cursor.date } },
        { date: query.cursor.date, _id: { $lt: query.cursor.id } },
      ];
    }
    return plain<Expense[]>(
      await ExpenseModel.find(filter)
        .sort({ date: -1, _id: -1 })
        .limit(query.limit ?? 0)
        .lean(),
    );
  }

  private async listPayments(query: { householdId: string; from: Date; to: Date }) {
    return plain<
      Array<{
        id: string;
        householdId: string;
        expenseId: string;
        membershipId: string;
        amount: number;
        createdByMembershipId: string;
        createdAt: Date;
      }>
    >(
      await ExpensePaymentModel.find({
        householdId: query.householdId,
        createdAt: { $gte: query.from, $lt: query.to },
      })
        .sort({ createdAt: 1, _id: 1 })
        .lean(),
    );
  }

  private async findActiveExpense(householdId: string, expenseId: string) {
    return plain<Expense | null>(
      await ExpenseModel.findOne({ householdId, _id: expenseId, status: "ACTIVE" }).lean(),
    );
  }

  private async attachSettlements(expenses: Expense[]) {
    if (expenses.length === 0) return expenses as ExpenseWithSettlement[];
    const settled = await this.loadSettlements(expenses);
    return expenses.map((expense) =>
      this.attachSettlement(expense, settled.get(expense.id)?.payments ?? [], settled.get(expense.id)?.shares),
    );
  }

  private async loadSettlements(expenses: Expense[]) {
    const paymentDocs = await ExpensePaymentModel.find({
      householdId: { $in: [...new Set(expenses.map((expense) => expense.householdId))] },
      expenseId: { $in: expenses.map((expense) => expense.id) },
    })
      .sort({ createdAt: 1, _id: 1 })
      .lean();
    const paymentsByExpense = new Map<string, Array<{
      id: string;
      householdId: string;
      expenseId: string;
      membershipId: string;
      amount: number;
      createdByMembershipId: string;
      createdAt: Date;
    }>>();
    for (const payment of paymentDocs) {
      const list = paymentsByExpense.get(payment.expenseId) ?? [];
      list.push(payment);
      paymentsByExpense.set(payment.expenseId, list);
    }
    const settlements = new Map<
      string,
      {
        payments: Array<{
          id: string;
          householdId: string;
          expenseId: string;
          membershipId: string;
          amount: number;
          createdByMembershipId: string;
          createdAt: Date;
        }>;
        shares: Array<{
          membershipId: string;
          assignedAmount: number;
          weightUsed?: number;
          paidAmount: number;
          remainingAmount: number;
          status: "PENDING" | "PARTIAL" | "PAID";
        }>;
      }
    >();
    for (const expense of expenses) {
      const payments = paymentsByExpense.get(expense.id) ?? [];
      const paidByMember = new Map<string, number>();
      for (const payment of payments) {
        paidByMember.set(payment.membershipId, (paidByMember.get(payment.membershipId) ?? 0) + payment.amount);
      }
      const shares = expense.split.shares.map((share) => {
        const paidAmount = paidByMember.get(share.membershipId) ?? 0;
        const remainingAmount = Math.max(share.assignedAmount - paidAmount, 0);
        const status: "PENDING" | "PARTIAL" | "PAID" =
          remainingAmount === 0
            ? "PAID"
            : paidAmount === 0
              ? "PENDING"
              : "PARTIAL";
        return {
          ...share,
          paidAmount,
          remainingAmount,
          status,
        };
      });
      settlements.set(expense.id, { payments, shares });
    }
    return settlements;
  }

  private async loadSettlement(expense: Expense) {
    return (await this.loadSettlements([expense])).get(expense.id) ?? { payments: [], shares: [] };
  }

  private async settlePayerShare(expense: Expense, createdByMembershipId: string) {
    const payerShare = expense.split.shares.find(
      (share) => share.membershipId === expense.payerMembershipId,
    );
    if (!payerShare || payerShare.assignedAmount <= 0) return;
    const paymentId = id("pay");
    await ExpensePaymentModel.create({
      _id: paymentId,
      id: paymentId,
      householdId: expense.householdId,
      expenseId: expense.id,
      membershipId: expense.payerMembershipId,
      amount: payerShare.assignedAmount,
      createdByMembershipId,
      createdAt: this.now(),
    });
  }

  private attachSettlement(
    expense: Expense,
    payments: Array<{
      id: string;
      householdId: string;
      expenseId: string;
      membershipId: string;
      amount: number;
      createdByMembershipId: string;
      createdAt: Date;
    }>,
    shares?: Array<{
      membershipId: string;
      assignedAmount: number;
      weightUsed?: number;
      paidAmount: number;
      remainingAmount: number;
      status: "PENDING" | "PARTIAL" | "PAID";
    }>,
  ) {
    const settlement = shares
      ? { payments, shares }
      : { payments, shares: expense.split.shares.map((share) => ({ ...share, paidAmount: 0, remainingAmount: share.assignedAmount, status: "PENDING" as const })) };
    return { ...expense, settlement } as ExpenseWithSettlement;
  }
}
