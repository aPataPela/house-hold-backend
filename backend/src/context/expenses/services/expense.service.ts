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
import { ExpenseModel } from "../models/expense.model";

const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const plain = <T>(doc: unknown): T => doc as T;

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
    return expense;
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
    return {
      expenses: page,
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
    const periodMembers = await this.listActiveMemberships(householdId, new Date(to.getTime() - 1));
    const ids = new Set(periodMembers.map((member) => member.id));
    for (const expense of expenses) {
      ids.add(expense.payerMembershipId);
      expense.split.shares.forEach((share) => ids.add(share.membershipId));
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
    return plain<{ id: string } | null>(
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
}
