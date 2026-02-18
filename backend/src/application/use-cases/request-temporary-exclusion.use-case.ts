import type { CategoryParticipationChangeRequest } from "../../domain/participation-request.js";
import { NotFoundError, ValidationError } from "../errors.js";
import type {
  CategoryParticipationChangeRequestRepository,
  CategoryRepository,
  HouseholdRepository,
  MembershipRepository,
} from "../ports/repositories.js";
import type { Clock, IdGenerator } from "../ports/services.js";

export interface RequestTemporaryExclusionInput {
  householdId: string;
  membershipId: string;
  categoryId: string;
  periodStart: string;
  periodEnd: string;
  reason: string;
}

export interface RequestTemporaryExclusionResult {
  request: CategoryParticipationChangeRequest;
}

interface RequestTemporaryExclusionDependencies {
  householdRepository: HouseholdRepository;
  membershipRepository: MembershipRepository;
  categoryRepository: CategoryRepository;
  categoryParticipationChangeRequestRepository: CategoryParticipationChangeRequestRepository;
  idGenerator: IdGenerator;
  clock: Clock;
}

export class RequestTemporaryExclusionUseCase {
  constructor(private readonly deps: RequestTemporaryExclusionDependencies) {}

  async execute(
    input: RequestTemporaryExclusionInput,
  ): Promise<RequestTemporaryExclusionResult> {
    const householdId = asRequiredTrimmed(input.householdId, "householdId");
    const membershipId = asRequiredTrimmed(input.membershipId, "membershipId");
    const categoryId = asRequiredTrimmed(input.categoryId, "categoryId");
    const reason = asRequiredTrimmed(input.reason, "reason");

    const periodStart = parseIsoDate(input.periodStart, "periodStart");
    const periodEnd = parseIsoDate(input.periodEnd, "periodEnd");

    if (periodStart >= periodEnd) {
      throw new ValidationError("periodStart must be before periodEnd");
    }

    const household = await this.deps.householdRepository.findById(householdId);
    if (!household) {
      throw new NotFoundError("household not found");
    }

    const membership = await this.deps.membershipRepository.findById(membershipId);
    if (!membership || membership.householdId !== household.id) {
      throw new NotFoundError("membership not found in household");
    }

    if (membership.status !== "ACTIVE") {
      throw new ValidationError("membership must be ACTIVE");
    }

    const category = await this.deps.categoryRepository.findById(categoryId);
    if (!category || category.householdId !== household.id || category.status !== "ACTIVE") {
      throw new NotFoundError("category not found or inactive in household");
    }

    const request: CategoryParticipationChangeRequest = {
      id: this.deps.idGenerator.next("req"),
      householdId: household.id,
      membershipId: membership.id,
      categoryId: category.id,
      requestType: "TEMPORARY_EXCLUDE",
      periodStart,
      periodEnd,
      reason,
      status: "PENDING",
      createdAt: this.deps.clock.now(),
    };

    await this.deps.categoryParticipationChangeRequestRepository.save(request);

    return {
      request,
    };
  }
}

const parseIsoDate = (value: string, label: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${label} must be a valid ISO date`);
  }
  return parsed;
};

const asRequiredTrimmed = (value: string, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`);
  }
  return value.trim();
};
