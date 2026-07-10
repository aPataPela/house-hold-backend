import { randomUUID } from "node:crypto";
import type { Preference, Role } from "../../shared/types/entities";
import { badRequest, forbidden, notFound } from "../../shared/errors/app-error";
import { parseDate } from "../../shared/utils/date";
import { CategoryModel } from "../../households/models/category.model";
import { MembershipModel } from "../../households/models/membership.model";
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
      mode:
        | "PARTICIPATES"
        | "HALF"
        | "NO_PARTICIPATES"
        | "INCLUDE_DEFAULT"
        | "EXCLUDE_DEFAULT";
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
    const weight = this.resolveWeight(input.mode, input.weight);
    const overlapping = await this.findOverlappingPreference({
      membershipId,
      categoryId,
      from: validFrom,
      to: validTo,
    });
    if (overlapping) {
      const sameStart = overlapping.validFrom.getTime() === validFrom.getTime();
      const overlappingEnd = overlapping.validTo?.getTime() ?? null;
      const requestedEnd = validTo?.getTime() ?? null;
      if (!sameStart || overlappingEnd !== requestedEnd) {
        throw badRequest("OVERLAPPING_PREFERENCE", "preference period overlaps an existing preference");
      }
      const updated: Preference = {
        ...overlapping,
        mode: input.mode,
        weight,
      };
      await PreferenceModel.replaceOne(
        { _id: overlapping.id },
        { ...updated, _id: overlapping.id },
      );
      return updated;
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

  async listRules(householdId: string, userId: string, input: { on: string }) {
    const viewer = await MembershipModel.findOne({
      householdId,
      userId,
      status: "ACTIVE",
      joinedAt: { $lte: this.now() },
      $or: [
        { leftAt: null },
        { leftAt: { $gt: this.now() } },
        { leftAt: { $exists: false } },
      ],
    }).lean();
    if (!viewer) throw forbidden("an active household membership is required");

    const on = parseDate(input.on, "on");
    const preferences = await PreferenceModel.find({
      householdId,
      validFrom: { $lte: on },
      $or: [{ validTo: null }, { validTo: { $gt: on } }, { validTo: { $exists: false } }],
    })
      .sort({ categoryId: 1, membershipId: 1, validFrom: -1 })
      .lean();

    return {
      preferences: plain<Preference[]>(preferences),
    };
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

  private resolveWeight(
    mode:
      | "PARTICIPATES"
      | "HALF"
      | "NO_PARTICIPATES"
      | "INCLUDE_DEFAULT"
      | "EXCLUDE_DEFAULT",
    weight?: number | undefined,
  ) {
    if (mode === "PARTICIPATES") return 1;
    if (mode === "HALF") return 0.5;
    if (mode === "NO_PARTICIPATES" || mode === "EXCLUDE_DEFAULT") return 0;
    const resolved = weight ?? 1;
    if (resolved <= 0) {
      throw badRequest("INVALID_WEIGHT", "weight must be positive");
    }
    return resolved;
  }
}
