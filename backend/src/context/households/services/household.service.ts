import { randomInt, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import type { Category, Household, Membership, Role } from "../../shared/types/entities";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors/app-error";
import { activeMembershipCriteria } from "../../shared/utils/membership";
import { parseDate, toDateString } from "../../shared/utils/date";
import { CategoryModel } from "../models/category.model";
import { HouseholdModel } from "../models/household.model";
import { MembershipModel } from "../models/membership.model";
import { UserModel } from "../../users/models/user.model";
import type { ExpenseService } from "../../expenses/services/expense.service";
import {
  RealtimeEventType,
  type JsonValue,
  type RealtimePublisher,
} from "@realtime/contracts";

const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const plain = <T>(doc: unknown): T => doc as T;
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class HouseholdService {
  constructor(
    private readonly now = () => new Date(),
    private readonly expenseService?: ExpenseService,
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async create(input: {
    name: string;
    currency: "CLP";
    createdByUserId?: string;
    livingSince?: string;
  }): Promise<{ household: Household; membership: Membership }> {
    if (!input.createdByUserId) throw badRequest("MISSING_USER", "createdByUserId is required");
    const now = this.now();
    const livingSince = input.livingSince
      ? parseDate(input.livingSince, "livingSince")
      : parseDate(toDateString(now), "livingSince");
    const household: Household = {
      id: id("hh"),
      name: input.name.trim(),
      currency: "CLP",
      approvalMode: "ADMIN_ONLY",
      inviteCode: await this.generateUniqueInviteCode(),
      createdAt: now,
    };
    const membership: Membership = {
      id: id("m"),
      householdId: household.id,
      userId: input.createdByUserId,
      role: "ADMIN",
      status: "ACTIVE",
      joinedAt: now,
      livingSince,
    };
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await HouseholdModel.create([{ ...household, _id: household.id }], { session });
        await MembershipModel.create([{ ...membership, _id: membership.id }], { session });
      });
    } finally {
      await session.endSession();
    }
    await this.publishChange(household.id, RealtimeEventType.HouseholdCreated, {
      householdId: household.id,
      membershipId: membership.id,
      creatorMembershipId: membership.id,
      name: household.name,
    });
    return { household, membership };
  }

  async joinByInviteCode(input: { inviteCode: string; userId: string; livingSince?: string }) {
    const inviteCode = input.inviteCode.trim().toLocaleUpperCase("en");
    const household = plain<Household | null>(await HouseholdModel.findOne({ inviteCode }).lean());
    if (!household) throw notFound("invite code");
    if (await this.findActiveMembershipByUser(household.id, input.userId)) {
      throw conflict("MEMBERSHIP_EXISTS", "user already has an active membership");
    }
    const now = this.now();
    const livingSince = input.livingSince
      ? parseDate(input.livingSince, "livingSince")
      : parseDate(toDateString(now), "livingSince");
    const membership: Membership = {
      id: id("m"),
      householdId: household.id,
      userId: input.userId,
      role: "MEMBER",
      status: "ACTIVE",
      joinedAt: now,
      livingSince,
    };
    await MembershipModel.create({ ...membership, _id: membership.id });
    const user = plain<{ name: string } | null>(await UserModel.findById(input.userId).lean());
    await this.reconcileExpenses(household.id, livingSince);
    await this.publishChange(household.id, RealtimeEventType.HouseholdMemberJoined, {
      householdId: household.id,
      membershipId: membership.id,
      userId: membership.userId,
      role: membership.role,
      livingSince: (membership.livingSince ?? membership.joinedAt).toISOString(),
    } as JsonValue);
    return { household, membership: { ...membership, ...(user ? { userName: user.name } : {}) } };
  }

  async regenerateInviteCode(householdId: string, input: { userId: string }) {
    if (!(await this.findHousehold(householdId))) throw notFound("household");
    const actor = await this.findActiveMembershipByUser(householdId, input.userId);
    if (!actor || actor.role !== "ADMIN") throw forbidden("only an active ADMIN can regenerate invite codes");
    const inviteCode = await this.generateUniqueInviteCode();
    const household = plain<Household | null>(
      await HouseholdModel.findByIdAndUpdate(
        householdId,
        { $set: { inviteCode } },
        { new: true, runValidators: true },
      ).lean(),
    );
    if (!household) throw notFound("household");
    await this.publishChange(householdId, RealtimeEventType.HouseholdInviteCodeRegenerated, {
      householdId,
    });
    return household;
  }

  async invite(
    householdId: string,
    input: { userId: string; role: Role; invitedByMembershipId: string; livingSince?: string },
  ) {
    if (!(await this.findHousehold(householdId))) throw notFound("household");
    const actor = await this.findActiveMembership(input.invitedByMembershipId, householdId);
    if (!actor || actor.role !== "ADMIN") throw forbidden("only an active ADMIN can invite members");
    if (await this.findActiveMembershipByUser(householdId, input.userId)) {
      throw conflict("MEMBERSHIP_EXISTS", "user already has an active membership");
    }
    const now = this.now();
    const livingSince = input.livingSince
      ? parseDate(input.livingSince, "livingSince")
      : parseDate(toDateString(now), "livingSince");
    const membership: Membership = {
      id: id("m"),
      householdId,
      userId: input.userId,
      role: input.role,
      status: "ACTIVE",
      joinedAt: now,
      livingSince,
    };
    await MembershipModel.create({ ...membership, _id: membership.id });
    await this.reconcileExpenses(householdId, livingSince);
    await this.publishChange(householdId, RealtimeEventType.HouseholdMemberInvited, {
      householdId,
      membershipId: membership.id,
      userId: membership.userId,
      role: membership.role,
      livingSince: (membership.livingSince ?? membership.joinedAt).toISOString(),
    } as JsonValue);
    return membership;
  }

  async createCategory(householdId: string, input: { name: string; createdByMembershipId: string }) {
    if (!(await this.findHousehold(householdId))) throw notFound("household");
    const actor = await this.findActiveMembership(input.createdByMembershipId, householdId);
    if (!actor || actor.role !== "ADMIN") throw forbidden("only an active ADMIN can create categories");
    const normalizedName = input.name.trim().toLocaleLowerCase("es");
    if (!normalizedName) throw badRequest("INVALID_NAME", "name is required");
    if (await this.findCategoryByName(householdId, normalizedName)) {
      throw conflict("CATEGORY_EXISTS", "category name already exists");
    }
    const category: Category = {
      id: id("cat"),
      householdId,
      name: input.name.trim(),
      normalizedName,
      status: "ACTIVE",
      createdAt: this.now(),
    };
    await CategoryModel.create({ ...category, _id: category.id });
    await this.publishChange(householdId, RealtimeEventType.HouseholdCategoryCreated, {
      householdId,
      categoryId: category.id,
      name: category.name,
    } as JsonValue);
    return category;
  }

  async listMembers(householdId: string, input: { requesterUserId: string }) {
    if (!(await this.findHousehold(householdId))) throw notFound("household");
    if (!(await this.findActiveMembershipByUser(householdId, input.requesterUserId))) {
      throw forbidden("an active membership is required");
    }
    const memberships = plain<Membership[]>(
      await MembershipModel.find({ householdId, status: "ACTIVE" })
        .sort({ joinedAt: 1 })
        .lean(),
    );
    const users = plain<Array<{ id: string; name: string }>>(
      await UserModel.find({ _id: { $in: memberships.map((membership) => membership.userId) } }).lean(),
    );
    const userNames = new Map(users.map((user) => [user.id, user.name]));
    return memberships.map((membership) => {
      const userName = userNames.get(membership.userId);
      return {
        ...membership,
        livingSince: membership.livingSince ?? membership.joinedAt,
        ...(userName ? { userName } : {}),
      };
    });
  }

  async listCategories(householdId: string, input: { requesterUserId: string }) {
    if (!(await this.findHousehold(householdId))) throw notFound("household");
    if (!(await this.findActiveMembershipByUser(householdId, input.requesterUserId))) {
      throw forbidden("an active membership is required");
    }
    return plain<Category[]>(
      await CategoryModel.find({ householdId, status: "ACTIVE" }).sort({ createdAt: 1 }).lean(),
    );
  }

  async findHousehold(id: string) {
    return plain<Household | null>(await HouseholdModel.findById(id).lean());
  }

  async findActiveMembership(id: string, householdId: string, date = new Date()) {
    return plain<Membership | null>(
      await MembershipModel.findOne({
        _id: id,
        householdId,
        ...activeMembershipCriteria(date),
      }).lean(),
    );
  }

  async findActiveMembershipByUser(householdId: string, userId: string) {
    return plain<Membership | null>(
      await MembershipModel.findOne({ householdId, userId, status: "ACTIVE" }).lean(),
    );
  }

  async findCategoryByName(householdId: string, normalizedName: string) {
    return plain<Category | null>(await CategoryModel.findOne({ householdId, normalizedName }).lean());
  }

  private async generateUniqueInviteCode() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = Array.from(
        { length: 6 },
        () => INVITE_CODE_ALPHABET[randomInt(0, INVITE_CODE_ALPHABET.length)],
      ).join("");
      if (!(await HouseholdModel.exists({ inviteCode: code }))) return code;
    }
    throw conflict("INVITE_CODE_COLLISION", "could not generate a unique invite code");
  }

  private async reconcileExpenses(householdId: string, livingSince: Date) {
    if (!this.expenseService) return;
    await this.expenseService.reconcileExpensesAfterLivingSinceChange(householdId, livingSince);
  }

  private async publishChange(householdId: string, type: string, payload: JsonValue) {
    if (!this.realtimePublisher) return;
    await this.realtimePublisher.publish({
      id: `${type}:${householdId}:${Date.now()}`,
      type,
      householdId,
      occurredAt: this.now().toISOString(),
      version: 1,
      payload,
    });
  }
}
