import { ForbiddenError, NotFoundError, ValidationError } from "../errors.js";
import type {
  CategoryRepository,
  HouseholdRepository,
  MemberCategoryPreferenceRepository,
  MembershipRepository,
} from "../ports/repositories.js";
import type { Clock, IdGenerator } from "../ports/services.js";
import type {
  MemberCategoryPreference,
  MemberCategoryPreferenceMode,
} from "../../domain/preferences.js";

export interface SetMemberCategoryPreferenceInput {
  householdId: string;
  membershipId: string;
  categoryId: string;
  mode: MemberCategoryPreferenceMode;
  weight?: number;
  validFrom: string;
  validTo?: string | null;
  changedByMembershipId: string;
}

export interface SetMemberCategoryPreferenceResult {
  preference: MemberCategoryPreference;
}

interface SetMemberCategoryPreferenceDependencies {
  householdRepository: HouseholdRepository;
  membershipRepository: MembershipRepository;
  categoryRepository: CategoryRepository;
  memberCategoryPreferenceRepository: MemberCategoryPreferenceRepository;
  idGenerator: IdGenerator;
  clock: Clock;
}

export class SetMemberCategoryPreferenceUseCase {
  constructor(private readonly deps: SetMemberCategoryPreferenceDependencies) {}

  async execute(input: SetMemberCategoryPreferenceInput): Promise<SetMemberCategoryPreferenceResult> {
    const householdId = asRequiredTrimmed(input.householdId, "householdId");
    const membershipId = asRequiredTrimmed(input.membershipId, "membershipId");
    const categoryId = asRequiredTrimmed(input.categoryId, "categoryId");
    const changedByMembershipId = asRequiredTrimmed(
      input.changedByMembershipId,
      "changedByMembershipId",
    );

    if (input.mode !== "INCLUDE_DEFAULT" && input.mode !== "EXCLUDE_DEFAULT") {
      throw new ValidationError("mode must be INCLUDE_DEFAULT or EXCLUDE_DEFAULT");
    }

    const validFrom = parseIsoDate(input.validFrom, "validFrom");
    const validTo = parseOptionalIsoDate(input.validTo, "validTo");

    if (validTo && validFrom >= validTo) {
      throw new ValidationError("validFrom must be before validTo");
    }

    const household = await this.deps.householdRepository.findById(householdId);
    if (!household) {
      throw new NotFoundError("household not found");
    }

    const membership = await this.deps.membershipRepository.findById(membershipId);
    if (!membership || membership.householdId !== household.id) {
      throw new NotFoundError("membership not found in household");
    }

    const changedByMembership = await this.deps.membershipRepository.findById(changedByMembershipId);
    if (!changedByMembership || changedByMembership.householdId !== household.id) {
      throw new NotFoundError("changedByMembership not found in household");
    }

    if (membership.status !== "ACTIVE") {
      throw new ValidationError("membership must be ACTIVE");
    }

    if (changedByMembership.status !== "ACTIVE") {
      throw new ValidationError("changedByMembership must be ACTIVE");
    }

    if (changedByMembership.id !== membership.id && changedByMembership.role !== "ADMIN") {
      throw new ForbiddenError("only ADMIN can modify preferences of other members");
    }

    const category = await this.deps.categoryRepository.findById(categoryId);
    if (!category || category.householdId !== household.id || category.status !== "ACTIVE") {
      throw new NotFoundError("category not found or inactive in household");
    }

    const weight = resolveWeight(input.mode, input.weight);

    const existing = await this.deps.memberCategoryPreferenceRepository.listByHouseholdMembershipCategory(
      household.id,
      membership.id,
      category.id,
    );

    const nextRange = {
      from: validFrom,
      to: validTo,
    };

    const hasOverlap = existing.some((preference) =>
      rangesOverlap(nextRange, {
        from: preference.validFrom,
        to: preference.validTo ?? null,
      }),
    );

    if (hasOverlap) {
      throw new ValidationError("preference date range overlaps an existing preference");
    }

    const preference: MemberCategoryPreference = {
      id: this.deps.idGenerator.next("pref"),
      householdId: household.id,
      membershipId: membership.id,
      categoryId: category.id,
      mode: input.mode,
      weight,
      validFrom,
      validTo: validTo ?? null,
    };

    await this.deps.memberCategoryPreferenceRepository.save(preference);

    return {
      preference,
    };
  }
}

const resolveWeight = (mode: MemberCategoryPreferenceMode, rawWeight: number | undefined): number => {
  if (mode === "EXCLUDE_DEFAULT") {
    return 1;
  }

  if (rawWeight === undefined || !Number.isFinite(rawWeight) || rawWeight <= 0) {
    throw new ValidationError("weight must be > 0 for INCLUDE_DEFAULT");
  }

  return rawWeight;
};

const parseIsoDate = (value: string, label: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${label} must be a valid ISO date`);
  }
  return parsed;
};

const parseOptionalIsoDate = (value: string | null | undefined, label: string): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${label} must be a valid ISO date or null`);
  }
  return parsed;
};

const asRequiredTrimmed = (value: string, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`);
  }
  return value.trim();
};

const rangesOverlap = (
  a: { from: Date; to: Date | null },
  b: { from: Date; to: Date | null },
): boolean => {
  const aEnd = a.to?.getTime() ?? Number.POSITIVE_INFINITY;
  const bEnd = b.to?.getTime() ?? Number.POSITIVE_INFINITY;

  return a.from.getTime() < bEnd && b.from.getTime() < aEnd;
};
