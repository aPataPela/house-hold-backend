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

export interface MongoCursor<TDocument> {
  sort(sort: Record<string, 1 | -1>): MongoCursor<TDocument>;
  limit(limit: number): MongoCursor<TDocument>;
  toArray(): Promise<TDocument[]>;
}

export interface MongoAggregationCursor<TDocument> {
  toArray(): Promise<TDocument[]>;
}

export interface MongoCollection<TDocument> {
  findOne(filter: Record<string, unknown>): Promise<TDocument | null>;
  replaceOne(
    filter: Record<string, unknown>,
    replacement: TDocument,
    options?: { upsert?: boolean },
  ): Promise<unknown>;
  find(filter: Record<string, unknown>): MongoCursor<TDocument>;
  aggregate<TOutput = unknown>(
    pipeline: Array<Record<string, unknown>>,
  ): MongoAggregationCursor<TOutput>;
  createIndex(
    keys: Record<string, 1 | -1>,
    options?: { name?: string; unique?: boolean },
  ): Promise<string>;
}

export interface MongoDb {
  collection<TDocument = unknown>(name: string): MongoCollection<TDocument>;
}

interface HouseholdDocument {
  _id: string;
  name: string;
  currency: "CLP";
  governanceSettings: {
    categoryParticipationApprovalMode: "ADMIN_ONLY";
  };
  createdAt: Date;
}

interface MembershipDocument {
  _id: string;
  householdId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INACTIVE";
  joinedAt: Date;
  leftAt?: Date | null;
}

interface CategoryDocument {
  _id: string;
  householdId: string;
  name: string;
  normalizedName: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
}

interface MemberCategoryPreferenceDocument {
  _id: string;
  householdId: string;
  membershipId: string;
  categoryId: string;
  mode: "INCLUDE_DEFAULT" | "EXCLUDE_DEFAULT";
  weight: number;
  validFrom: Date;
  validTo?: Date | null;
}

interface CategoryParticipationChangeRequestDocument {
  _id: string;
  householdId: string;
  membershipId: string;
  categoryId: string;
  requestType: "TEMPORARY_EXCLUDE";
  periodStart: Date;
  periodEnd: Date;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decision?: {
    decidedByMembershipId: string;
    decidedAt: Date;
    comment?: string;
  };
  createdAt: Date;
}

interface ExpenseDocument {
  _id: string;
  householdId: string;
  categoryId: string;
  payerMembershipId: string;
  date: Date;
  totalAmount: number;
  status: "ACTIVE" | "CANCELLED";
  note?: string;
  items: Expense["items"];
  split: Expense["split"];
  audit: {
    createdByMembershipId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class MongoHouseholdRepository implements HouseholdRepository {
  constructor(private readonly collection: MongoCollection<HouseholdDocument>) {}

  async findById(householdId: string): Promise<Household | null> {
    const document = await this.collection.findOne({ _id: householdId });
    return document ? toHousehold(document) : null;
  }

  async save(household: Household): Promise<void> {
    await this.collection.replaceOne(
      { _id: household.id },
      {
        _id: household.id,
        name: household.name,
        currency: household.currency,
        governanceSettings: household.governanceSettings,
        createdAt: household.createdAt,
      },
      { upsert: true },
    );
  }
}

export class MongoMembershipRepository implements MembershipRepository {
  constructor(private readonly collection: MongoCollection<MembershipDocument>) {}

  async findById(membershipId: string): Promise<Membership | null> {
    const document = await this.collection.findOne({ _id: membershipId });
    return document ? toMembership(document) : null;
  }

  async listActiveByHouseholdOnDate(householdId: string, date: Date): Promise<Membership[]> {
    const documents = await this.collection
      .find({
        householdId,
        ...activeMembershipFilterOnDate(date),
      })
      .toArray();

    return documents.map(toMembership).filter((membership) => isMembershipActiveOn(membership, date));
  }

  async findActiveByHouseholdAndUser(
    householdId: string,
    userId: string,
    date: Date,
  ): Promise<Membership | null> {
    const document = await this.collection.findOne({
      householdId,
      userId,
      ...activeMembershipFilterOnDate(date),
    });

    if (!document) {
      return null;
    }

    const membership = toMembership(document);
    return isMembershipActiveOn(membership, date) ? membership : null;
  }

  async save(membership: Membership): Promise<void> {
    await this.collection.replaceOne(
      { _id: membership.id },
      {
        _id: membership.id,
        householdId: membership.householdId,
        userId: membership.userId,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt,
        leftAt: membership.leftAt ?? null,
      },
      { upsert: true },
    );
  }
}

export class MongoCategoryRepository implements CategoryRepository {
  constructor(private readonly collection: MongoCollection<CategoryDocument>) {}

  async findById(categoryId: string): Promise<Category | null> {
    const document = await this.collection.findOne({ _id: categoryId });
    return document ? toCategory(document) : null;
  }

  async findByHouseholdAndNormalizedName(
    householdId: string,
    normalizedName: string,
  ): Promise<Category | null> {
    const document = await this.collection.findOne({ householdId, normalizedName });
    return document ? toCategory(document) : null;
  }

  async save(category: Category): Promise<void> {
    await this.collection.replaceOne(
      { _id: category.id },
      {
        _id: category.id,
        householdId: category.householdId,
        name: category.name,
        normalizedName: normalizeCategoryName(category.name),
        status: category.status,
        createdAt: category.createdAt,
      },
      { upsert: true },
    );
  }
}

export class MongoMemberCategoryPreferenceRepository
  implements MemberCategoryPreferenceRepository
{
  constructor(private readonly collection: MongoCollection<MemberCategoryPreferenceDocument>) {}

  async listByHouseholdCategoryOnDate(
    householdId: string,
    categoryId: string,
    date: Date,
  ): Promise<MemberCategoryPreference[]> {
    const documents = await this.collection
      .find({
        householdId,
        categoryId,
        validFrom: { $lte: date },
        ...activeUpperBoundFilter("validTo", date),
      })
      .toArray();

    return documents
      .map(toMemberCategoryPreference)
      .filter((preference) => isPreferenceValidOn(preference, date));
  }

  async listByHouseholdMembershipCategory(
    householdId: string,
    membershipId: string,
    categoryId: string,
  ): Promise<MemberCategoryPreference[]> {
    const documents = await this.collection
      .find({
        householdId,
        membershipId,
        categoryId,
      })
      .sort({ validFrom: 1, _id: 1 })
      .toArray();

    return documents.map(toMemberCategoryPreference);
  }

  async save(preference: MemberCategoryPreference): Promise<void> {
    await this.collection.replaceOne(
      { _id: preference.id },
      {
        _id: preference.id,
        householdId: preference.householdId,
        membershipId: preference.membershipId,
        categoryId: preference.categoryId,
        mode: preference.mode,
        weight: preference.weight,
        validFrom: preference.validFrom,
        validTo: preference.validTo ?? null,
      },
      { upsert: true },
    );
  }
}

export class MongoCategoryParticipationChangeRequestRepository
  implements CategoryParticipationChangeRequestRepository
{
  constructor(
    private readonly collection: MongoCollection<CategoryParticipationChangeRequestDocument>,
  ) {}

  async listApprovedTemporaryExclusionsOnDate(
    householdId: string,
    categoryId: string,
    date: Date,
  ): Promise<CategoryParticipationChangeRequest[]> {
    const documents = await this.collection
      .find({
        householdId,
        categoryId,
        requestType: "TEMPORARY_EXCLUDE",
        status: "APPROVED",
        periodStart: { $lte: date },
        periodEnd: { $gt: date },
      })
      .toArray();

    return documents
      .map(toParticipationRequest)
      .filter((request) => isApprovedTemporaryExclusionActiveOn(request, date));
  }

  async findById(requestId: string): Promise<CategoryParticipationChangeRequest | null> {
    const document = await this.collection.findOne({ _id: requestId });
    return document ? toParticipationRequest(document) : null;
  }

  async save(request: CategoryParticipationChangeRequest): Promise<void> {
    await this.collection.replaceOne(
      { _id: request.id },
      {
        _id: request.id,
        householdId: request.householdId,
        membershipId: request.membershipId,
        categoryId: request.categoryId,
        requestType: request.requestType,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd,
        reason: request.reason,
        status: request.status,
        createdAt: request.createdAt,
        ...(request.decision
          ? {
              decision: {
                decidedByMembershipId: request.decision.decidedByMembershipId,
                decidedAt: request.decision.decidedAt,
                ...(request.decision.comment
                  ? {
                      comment: request.decision.comment,
                    }
                  : {}),
              },
            }
          : {}),
      },
      { upsert: true },
    );
  }
}

export class MongoExpenseRepository implements ExpenseRepository {
  constructor(private readonly collection: MongoCollection<ExpenseDocument>) {}

  async save(expense: Expense): Promise<void> {
    await this.collection.replaceOne(
      { _id: expense.id },
      {
        _id: expense.id,
        householdId: expense.householdId,
        categoryId: expense.categoryId,
        payerMembershipId: expense.payerMembershipId,
        date: expense.date,
        totalAmount: expense.totalAmount,
        status: expense.status,
        items: expense.items,
        split: expense.split,
        audit: expense.audit,
        ...(expense.note ? { note: expense.note } : {}),
      },
      { upsert: true },
    );
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
  ): Promise<Expense[]> {
    const filter: Record<string, unknown> = {
      householdId,
      date: { $gte: period.from, $lt: period.to },
      ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params?.status ? { status: params.status } : {}),
    };

    if (params?.cursor) {
      const cursorDocument = await this.collection.findOne({
        _id: params.cursor,
        householdId,
      });

      if (cursorDocument) {
        filter.$or = [
          { date: { $lt: cursorDocument.date } },
          { date: cursorDocument.date, _id: { $lt: cursorDocument._id } },
        ];
      }
    }

    let query = this.collection.find(filter).sort({ date: -1, _id: -1 });
    const limit = params?.limit ?? (params?.cursor ? 50 : undefined);

    if (limit !== undefined) {
      query = query.limit(limit);
    }

    const documents = await query.toArray();
    return documents.map(toExpense);
  }
}

export class MongoHouseholdBalanceReadModel implements HouseholdBalanceReadModel {
  constructor(private readonly expenseCollection: MongoCollection<ExpenseDocument>) {}

  async getBalance(householdId: string, period: Period): Promise<HouseholdBalanceRow[]> {
    const match = {
      householdId,
      status: "ACTIVE",
      date: { $gte: period.from, $lt: period.to },
    };

    const paidRows = await this.expenseCollection
      .aggregate<{ _id: string; paid: number }>([
        { $match: match },
        {
          $group: {
            _id: "$payerMembershipId",
            paid: { $sum: "$totalAmount" },
          },
        },
      ])
      .toArray();

    const assignedRows = await this.expenseCollection
      .aggregate<{ _id: string; assigned: number }>([
        { $match: match },
        { $unwind: "$split.shares" },
        {
          $group: {
            _id: "$split.shares.membershipId",
            assigned: { $sum: "$split.shares.assignedAmount" },
          },
        },
      ])
      .toArray();

    const byMembership = new Map<string, { paid: number; assigned: number }>();

    for (const row of paidRows) {
      const current = byMembership.get(row._id) ?? { paid: 0, assigned: 0 };
      current.paid += asFiniteNumber(row.paid, 0);
      byMembership.set(row._id, current);
    }

    for (const row of assignedRows) {
      const current = byMembership.get(row._id) ?? { paid: 0, assigned: 0 };
      current.assigned += asFiniteNumber(row.assigned, 0);
      byMembership.set(row._id, current);
    }

    return [...byMembership.entries()].map(([membershipId, totals]) => ({
      membershipId,
      paid: totals.paid,
      assigned: totals.assigned,
      netBalance: totals.paid - totals.assigned,
    }));
  }
}

export const createMongoRepositories = (database: MongoDb) => {
  const householdCollection = database.collection<HouseholdDocument>("households");
  const membershipCollection = database.collection<MembershipDocument>("memberships");
  const categoryCollection = database.collection<CategoryDocument>("categories");
  const preferenceCollection = database.collection<MemberCategoryPreferenceDocument>(
    "member_category_preferences",
  );
  const participationRequestCollection =
    database.collection<CategoryParticipationChangeRequestDocument>(
      "category_participation_change_requests",
    );
  const expenseCollection = database.collection<ExpenseDocument>("expenses");

  return {
    householdRepository: new MongoHouseholdRepository(householdCollection),
    membershipRepository: new MongoMembershipRepository(membershipCollection),
    categoryRepository: new MongoCategoryRepository(categoryCollection),
    memberCategoryPreferenceRepository: new MongoMemberCategoryPreferenceRepository(
      preferenceCollection,
    ),
    participationChangeRequestRepository: new MongoCategoryParticipationChangeRequestRepository(
      participationRequestCollection,
    ),
    expenseRepository: new MongoExpenseRepository(expenseCollection),
    householdBalanceReadModel: new MongoHouseholdBalanceReadModel(expenseCollection),
  };
};

const toHousehold = (document: HouseholdDocument): Household => ({
  id: document._id,
  name: document.name,
  currency: document.currency,
  governanceSettings: document.governanceSettings,
  createdAt: toDate(document.createdAt, "household.createdAt"),
});

const toMembership = (document: MembershipDocument): Membership => ({
  id: document._id,
  householdId: document.householdId,
  userId: document.userId,
  role: document.role,
  status: document.status,
  joinedAt: toDate(document.joinedAt, "membership.joinedAt"),
  leftAt:
    document.leftAt !== undefined && document.leftAt !== null
      ? toDate(document.leftAt, "membership.leftAt")
      : null,
});

const toCategory = (document: CategoryDocument): Category => ({
  id: document._id,
  householdId: document.householdId,
  name: document.name,
  status: document.status,
  createdAt: toDate(document.createdAt, "category.createdAt"),
});

const toMemberCategoryPreference = (
  document: MemberCategoryPreferenceDocument,
): MemberCategoryPreference => ({
  id: document._id,
  householdId: document.householdId,
  membershipId: document.membershipId,
  categoryId: document.categoryId,
  mode: document.mode,
  weight: document.weight,
  validFrom: toDate(document.validFrom, "preference.validFrom"),
  validTo:
    document.validTo !== undefined && document.validTo !== null
      ? toDate(document.validTo, "preference.validTo")
      : null,
});

const toParticipationRequest = (
  document: CategoryParticipationChangeRequestDocument,
): CategoryParticipationChangeRequest => ({
  id: document._id,
  householdId: document.householdId,
  membershipId: document.membershipId,
  categoryId: document.categoryId,
  requestType: document.requestType,
  periodStart: toDate(document.periodStart, "request.periodStart"),
  periodEnd: toDate(document.periodEnd, "request.periodEnd"),
  reason: document.reason,
  status: document.status,
  createdAt: toDate(document.createdAt, "request.createdAt"),
  ...(document.decision
    ? {
        decision: {
          decidedByMembershipId: document.decision.decidedByMembershipId,
          decidedAt: toDate(document.decision.decidedAt, "request.decision.decidedAt"),
          ...(document.decision.comment
            ? {
                comment: document.decision.comment,
              }
            : {}),
        },
      }
    : {}),
});

const toExpense = (document: ExpenseDocument): Expense => ({
  id: document._id,
  householdId: document.householdId,
  categoryId: document.categoryId,
  payerMembershipId: document.payerMembershipId,
  date: toDate(document.date, "expense.date"),
  totalAmount: document.totalAmount,
  status: document.status,
  items: document.items,
  split: document.split,
  audit: {
    createdByMembershipId: document.audit.createdByMembershipId,
    createdAt: toDate(document.audit.createdAt, "expense.audit.createdAt"),
    updatedAt: toDate(document.audit.updatedAt, "expense.audit.updatedAt"),
  },
  ...(document.note ? { note: document.note } : {}),
});

const activeMembershipFilterOnDate = (date: Date): Record<string, unknown> => ({
  status: "ACTIVE",
  joinedAt: { $lte: date },
  ...activeUpperBoundFilter("leftAt", date),
});

const activeUpperBoundFilter = (fieldName: string, date: Date): Record<string, unknown> => ({
  $or: [
    { [fieldName]: null },
    { [fieldName]: { $exists: false } },
    { [fieldName]: { $gt: date } },
  ],
});

const normalizeCategoryName = (name: string): string => name.trim().toLowerCase();

const toDate = (value: unknown, fieldName: string): Date => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  throw new Error(`invalid date for ${fieldName}`);
};

const asFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return fallback;
};
