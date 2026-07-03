import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import type { Category, Household, Membership, Role } from "../../shared/types/entities";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors/app-error";
import { CategoryModel } from "../models/category.model";
import { HouseholdModel } from "../models/household.model";
import { MembershipModel } from "../models/membership.model";

const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const plain = <T>(doc: unknown): T => doc as T;

export class HouseholdService {
  constructor(private readonly now = () => new Date()) {}

  async create(input: {
    name: string;
    currency: "CLP";
    createdByUserId: string;
  }): Promise<{ household: Household; membership: Membership }> {
    const now = this.now();
    const household: Household = {
      id: id("hh"),
      name: input.name.trim(),
      currency: "CLP",
      approvalMode: "ADMIN_ONLY",
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
    if (!(await this.findActiveMembership(input.createdByMembershipId, householdId))) {
      throw forbidden("an active membership is required");
    }
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
}
