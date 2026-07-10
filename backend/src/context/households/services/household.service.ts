import { randomInt, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import type { Category, Household, Membership, Role } from "../../shared/types/entities";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors/app-error";
import { CategoryModel } from "../models/category.model";
import { HouseholdModel } from "../models/household.model";
import { MembershipModel } from "../models/membership.model";
import { UserModel } from "../../users/models/user.model";

const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const plain = <T>(doc: unknown): T => doc as T;
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class HouseholdService {
  constructor(private readonly now = () => new Date()) {}

  async create(input: {
    name: string;
    currency: "CLP";
    createdByUserId?: string;
  }): Promise<{ household: Household; membership: Membership }> {
    if (!input.createdByUserId) throw badRequest("MISSING_USER", "createdByUserId is required");
    const now = this.now();
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
    return { household, membership };
  }

  async joinByInviteCode(input: { inviteCode: string; userId: string }) {
    const inviteCode = input.inviteCode.trim().toLocaleUpperCase("en");
    const household = plain<Household | null>(await HouseholdModel.findOne({ inviteCode }).lean());
    if (!household) throw notFound("invite code");
    if (await this.findActiveMembershipByUser(household.id, input.userId)) {
      throw conflict("MEMBERSHIP_EXISTS", "user already has an active membership");
    }
    const membership: Membership = {
      id: id("m"),
      householdId: household.id,
      userId: input.userId,
      role: "MEMBER",
      status: "ACTIVE",
      joinedAt: this.now(),
    };
    await MembershipModel.create({ ...membership, _id: membership.id });
    const user = plain<{ name: string } | null>(await UserModel.findById(input.userId).lean());
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
    return household;
  }

  async invite(householdId: string, input: { userId: string; role: Role; invitedByMembershipId: string }) {
    if (!(await this.findHousehold(householdId))) throw notFound("household");
    const actor = await this.findActiveMembership(input.invitedByMembershipId, householdId);
    if (!actor || actor.role !== "ADMIN") throw forbidden("only an active ADMIN can invite members");
    if (await this.findActiveMembershipByUser(householdId, input.userId)) {
      throw conflict("MEMBERSHIP_EXISTS", "user already has an active membership");
    }
    const membership: Membership = {
      id: id("m"),
      householdId,
      userId: input.userId,
      role: input.role,
      status: "ACTIVE",
      joinedAt: this.now(),
    };
    await MembershipModel.create({ ...membership, _id: membership.id });
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
    return category;
  }

  async listMembers(householdId: string, input: { requesterUserId: string }) {
    if (!(await this.findHousehold(householdId))) throw notFound("household");
    if (!(await this.findActiveMembershipByUser(householdId, input.requesterUserId))) {
      throw forbidden("an active membership is required");
    }
    const memberships = plain<Membership[]>(
      await MembershipModel.find({ householdId, status: "ACTIVE" }).sort({ joinedAt: 1 }).lean(),
    );
    const users = plain<Array<{ id: string; name: string }>>(
      await UserModel.find({ _id: { $in: memberships.map((membership) => membership.userId) } }).lean(),
    );
    const userNames = new Map(users.map((user) => [user.id, user.name]));
    return memberships.map((membership) => {
      const userName = userNames.get(membership.userId);
      return {
        ...membership,
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
        status: "ACTIVE",
        joinedAt: { $lte: date },
        $or: [{ leftAt: null }, { leftAt: { $gt: date } }, { leftAt: { $exists: false } }],
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
}
