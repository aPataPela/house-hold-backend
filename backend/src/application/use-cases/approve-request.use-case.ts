import type { CategoryParticipationChangeRequest } from "../../domain/participation-request.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../errors.js";
import type {
  CategoryParticipationChangeRequestRepository,
  HouseholdRepository,
  MembershipRepository,
} from "../ports/repositories.js";
import type { Clock } from "../ports/services.js";

export interface ApproveRequestInput {
  householdId: string;
  requestId: string;
  decision: "APPROVED" | "REJECTED";
  decidedByMembershipId: string;
  comment?: string;
}

export interface ApproveRequestResult {
  request: CategoryParticipationChangeRequest;
}

interface ApproveRequestDependencies {
  householdRepository: HouseholdRepository;
  membershipRepository: MembershipRepository;
  categoryParticipationChangeRequestRepository: CategoryParticipationChangeRequestRepository;
  clock: Clock;
}

export class ApproveRequestUseCase {
  constructor(private readonly deps: ApproveRequestDependencies) {}

  async execute(input: ApproveRequestInput): Promise<ApproveRequestResult> {
    const householdId = asRequiredTrimmed(input.householdId, "householdId");
    const requestId = asRequiredTrimmed(input.requestId, "requestId");
    const decidedByMembershipId = asRequiredTrimmed(
      input.decidedByMembershipId,
      "decidedByMembershipId",
    );

    if (input.decision !== "APPROVED" && input.decision !== "REJECTED") {
      throw new ValidationError("decision must be APPROVED or REJECTED");
    }

    const household = await this.deps.householdRepository.findById(householdId);
    if (!household) {
      throw new NotFoundError("household not found");
    }

    if (household.governanceSettings.categoryParticipationApprovalMode !== "ADMIN_ONLY") {
      throw new ValidationError("unsupported governance approval mode");
    }

    const decider = await this.deps.membershipRepository.findById(decidedByMembershipId);
    if (!decider || decider.householdId !== household.id) {
      throw new NotFoundError("decidedByMembership not found in household");
    }

    if (decider.status !== "ACTIVE") {
      throw new ForbiddenError("decidedByMembership must be ACTIVE");
    }

    if (decider.role !== "ADMIN") {
      throw new ForbiddenError("only ADMIN can decide requests in V1");
    }

    const existingRequest = await this.deps.categoryParticipationChangeRequestRepository.findById(
      requestId,
    );

    if (!existingRequest || existingRequest.householdId !== household.id) {
      throw new NotFoundError("request not found in household");
    }

    if (existingRequest.status !== "PENDING") {
      throw new ConflictError("request is already decided");
    }

    const comment = input.comment?.trim();

    const updatedRequest: CategoryParticipationChangeRequest = {
      ...existingRequest,
      status: input.decision,
      decision: {
        decidedByMembershipId: decider.id,
        decidedAt: this.deps.clock.now(),
        ...(comment ? { comment } : {}),
      },
    };

    await this.deps.categoryParticipationChangeRequestRepository.save(updatedRequest);

    return {
      request: updatedRequest,
    };
  }
}

const asRequiredTrimmed = (value: string, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`);
  }
  return value.trim();
};
