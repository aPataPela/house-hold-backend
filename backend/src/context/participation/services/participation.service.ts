import { randomUUID } from "node:crypto";
import type { CategoryExclusion, Preference, Role } from "../../shared/types/entities";
import { badRequest, forbidden, notFound } from "../../shared/errors/app-error";
import { parseDate } from "../../shared/utils/date";
import { CategoryModel } from "../../households/models/category.model";
import { MembershipModel } from "../../households/models/membership.model";
import { CategoryExclusionModel } from "../models/category-exclusion.model";
import { PreferenceModel } from "../models/preference.model";

const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const plain = <T>(doc: unknown): T => doc as T;

export class ParticipationService {
  constructor(private readonly now = () => new Date()) {}

  async setPreference(
    householdId: string,
    categoryId: string,
    membershipId: string,
    input: {
      mode: "INCLUDE_DEFAULT" | "EXCLUDE_DEFAULT";
      weight?: number | undefined;
      validFrom: string;
      validTo?: string | null | undefined;
      changedByMembershipId: string;
    },
  ) {
    const category = await CategoryModel.findById(categoryId).lean();
    if (!category || category.householdId !== householdId) throw notFound("category");
    const membership = await MembershipModel.findById(membershipId).lean();
    if (!membership || membership.householdId !== householdId) throw notFound("membership");
    const actor = await this.findActiveMembership(input.changedByMembershipId, householdId);
    if (!actor || (actor.id !== membershipId && actor.role !== "ADMIN")) {
      throw forbidden("only an ADMIN can change another member preference");
    }
    const validFrom = parseDate(input.validFrom, "validFrom");
    const validTo = input.validTo ? parseDate(input.validTo, "validTo") : null;
    if (validTo && validFrom >= validTo) {
      throw badRequest("INVALID_PERIOD", "validFrom must be before validTo");
    }
    if (await this.findOverlappingPreference({ membershipId, categoryId, from: validFrom, to: validTo })) {
      throw badRequest("OVERLAPPING_PREFERENCE", "preference period overlaps an existing preference");
    }
    const weight = input.mode === "INCLUDE_DEFAULT" ? (input.weight ?? 1) : 0;
    if (input.mode === "INCLUDE_DEFAULT" && weight <= 0) {
      throw badRequest("INVALID_WEIGHT", "weight must be positive");
    }
    const preference: Preference = {
      id: id("pref"),
      householdId,
      categoryId,
      membershipId,
      mode: input.mode,
      weight,
      validFrom,
      validTo,
    };
    await PreferenceModel.create({ ...preference, _id: preference.id });
    return preference;
  }

  async createExclusion(
    householdId: string,
    input: {
      membershipId: string;
      categoryId: string;
      periodStart: string;
      periodEnd: string;
      reason?: string | undefined;
      createdByMembershipId: string;
    },
  ) {
    const membership = await this.findActiveMembership(input.membershipId, householdId);
    if (!membership) {
      throw notFound("membership");
    }
    const category = await CategoryModel.findById(input.categoryId).lean();
    if (!category || category.householdId !== householdId || category.status !== "ACTIVE") {
      throw notFound("category");
    }
    const actor = await this.findActiveMembership(input.createdByMembershipId, householdId);
    if (!actor) throw forbidden("an active membership is required");
    this.assertCanManageExclusion(actor, input.membershipId);
    const periodStart = parseDate(input.periodStart, "periodStart");
    const periodEnd = parseDate(input.periodEnd, "periodEnd");
    if (periodStart >= periodEnd) throw badRequest("INVALID_PERIOD", "periodStart must be before periodEnd");
    if (
      await this.findOverlappingActiveExclusion({
        membershipId: input.membershipId,
        categoryId: input.categoryId,
        from: periodStart,
        to: periodEnd,
      })
    ) {
      throw badRequest("OVERLAPPING_EXCLUSION", "exclusion period overlaps an active exclusion");
    }
    const exclusion: CategoryExclusion = {
      id: id("excl"),
      householdId,
      membershipId: input.membershipId,
      categoryId: input.categoryId,
      periodStart,
      periodEnd,
      ...(input.reason ? { reason: input.reason.trim() } : {}),
      status: "ACTIVE",
      createdByMembershipId: actor.id,
      createdAt: this.now(),
    };
    await CategoryExclusionModel.create({ ...exclusion, _id: exclusion.id });
    return exclusion;
  }

  async cancelExclusion(
    householdId: string,
    exclusionId: string,
    input: { cancelledByMembershipId: string },
  ) {
    const exclusion = plain<CategoryExclusion | null>(
      await CategoryExclusionModel.findById(exclusionId).lean(),
    );
    if (!exclusion || exclusion.householdId !== householdId) throw notFound("category exclusion");
    if (exclusion.status !== "ACTIVE") {
      throw badRequest("EXCLUSION_ALREADY_CANCELLED", "exclusion has already been cancelled");
    }
    const actor = await this.findActiveMembership(input.cancelledByMembershipId, householdId);
    if (!actor) throw forbidden("an active membership is required");
    this.assertCanManageExclusion(actor, exclusion.membershipId);
    exclusion.status = "CANCELLED";
    exclusion.cancelledByMembershipId = actor.id;
    exclusion.cancelledAt = this.now();
    await CategoryExclusionModel.replaceOne({ _id: exclusion.id }, { ...exclusion, _id: exclusion.id });
    return exclusion;
  }

  private async findActiveMembership(id: string, householdId: string, date = new Date()) {
    return plain<{ id: string; role: Role } | null>(
      await MembershipModel.findOne({
        _id: id,
        householdId,
        status: "ACTIVE",
        joinedAt: { $lte: date },
        $or: [{ leftAt: null }, { leftAt: { $gt: date } }, { leftAt: { $exists: false } }],
      }).lean(),
    );
  }

  private assertCanManageExclusion(actor: { id: string; role: Role }, membershipId: string) {
    if (actor.id !== membershipId && actor.role !== "ADMIN") {
      throw forbidden("only an ADMIN can manage another member exclusion");
    }
  }

  private async findOverlappingPreference(input: {
    membershipId: string;
    categoryId: string;
    from: Date;
    to?: Date | null;
  }) {
    const end = input.to ?? new Date("9999-12-31T00:00:00.000Z");
    return plain<Preference | null>(
      await PreferenceModel.findOne({
        membershipId: input.membershipId,
        categoryId: input.categoryId,
        validFrom: { $lt: end },
        $or: [{ validTo: null }, { validTo: { $gt: input.from } }, { validTo: { $exists: false } }],
      }).lean(),
    );
  }

  private async findOverlappingActiveExclusion(input: {
    membershipId: string;
    categoryId: string;
    from: Date;
    to: Date;
  }) {
    return plain<CategoryExclusion | null>(
      await CategoryExclusionModel.findOne({
        membershipId: input.membershipId,
        categoryId: input.categoryId,
        status: "ACTIVE",
        periodStart: { $lt: input.to },
        periodEnd: { $gt: input.from },
      }).lean(),
    );
  }
}
