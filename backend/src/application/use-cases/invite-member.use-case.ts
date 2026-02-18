import type { Membership } from "../../domain/membership.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../errors.js";
import type { HouseholdRepository, MembershipRepository } from "../ports/repositories.js";
import type { Clock, IdGenerator } from "../ports/services.js";

export interface InviteMemberInput {
  householdId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  invitedByMembershipId: string;
}

export interface InviteMemberResult {
  membership: Membership;
}

interface InviteMemberDependencies {
  householdRepository: HouseholdRepository;
  membershipRepository: MembershipRepository;
  idGenerator: IdGenerator;
  clock: Clock;
}

export class InviteMemberUseCase {
  constructor(private readonly deps: InviteMemberDependencies) {}

  async execute(input: InviteMemberInput): Promise<InviteMemberResult> {
    const householdId = input.householdId?.trim();
    const userId = input.userId?.trim();
    const invitedByMembershipId = input.invitedByMembershipId?.trim();

    if (!householdId) {
      throw new ValidationError("householdId is required");
    }

    if (!userId) {
      throw new ValidationError("userId is required");
    }

    if (!invitedByMembershipId) {
      throw new ValidationError("invitedByMembershipId is required");
    }

    if (!["ADMIN", "MEMBER"].includes(input.role)) {
      throw new ValidationError("role must be ADMIN or MEMBER");
    }

    const household = await this.deps.householdRepository.findById(householdId);
    if (!household) {
      throw new NotFoundError("household not found");
    }

    const inviter = await this.deps.membershipRepository.findById(invitedByMembershipId);
    if (!inviter) {
      throw new NotFoundError("invitedByMembership not found");
    }

    if (inviter.householdId !== household.id) {
      throw new ForbiddenError("inviter membership does not belong to household");
    }

    if (inviter.status !== "ACTIVE") {
      throw new ForbiddenError("inviter membership must be ACTIVE");
    }

    if (inviter.role !== "ADMIN") {
      throw new ForbiddenError("only ADMIN can invite members");
    }

    const now = this.deps.clock.now();
    const duplicated = await this.deps.membershipRepository.findActiveByHouseholdAndUser(
      household.id,
      userId,
      now,
    );

    if (duplicated) {
      throw new ConflictError("user already has an active membership in this household");
    }

    const membership: Membership = {
      id: this.deps.idGenerator.next("m"),
      householdId: household.id,
      userId,
      role: input.role,
      status: "ACTIVE",
      joinedAt: now,
      leftAt: null,
    };

    await this.deps.membershipRepository.save(membership);

    return {
      membership,
    };
  }
}
