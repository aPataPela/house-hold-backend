import type { Household, GovernanceSettings } from "../../domain/household.js";
import type { Membership } from "../../domain/membership.js";
import { ValidationError } from "../errors.js";
import type { HouseholdRepository, MembershipRepository } from "../ports/repositories.js";
import type { Clock, IdGenerator } from "../ports/services.js";

export interface CreateHouseholdInput {
  name: string;
  currency: "CLP";
  governanceSettings?: GovernanceSettings;
  createdByUserId: string;
}

export interface CreateHouseholdResult {
  household: Household;
  creatorMembership: Membership;
}

interface CreateHouseholdDependencies {
  householdRepository: HouseholdRepository;
  membershipRepository: MembershipRepository;
  idGenerator: IdGenerator;
  clock: Clock;
}

export class CreateHouseholdUseCase {
  constructor(private readonly deps: CreateHouseholdDependencies) {}

  async execute(input: CreateHouseholdInput): Promise<CreateHouseholdResult> {
    const name = input.name?.trim();
    const createdByUserId = input.createdByUserId?.trim();

    if (!name) {
      throw new ValidationError("name is required");
    }

    if (input.currency !== "CLP") {
      throw new ValidationError("currency must be CLP in V1");
    }

    if (!createdByUserId) {
      throw new ValidationError("createdByUserId is required");
    }

    const now = this.deps.clock.now();

    const household: Household = {
      id: this.deps.idGenerator.next("hh"),
      name,
      currency: "CLP",
      governanceSettings: {
        categoryParticipationApprovalMode:
          input.governanceSettings?.categoryParticipationApprovalMode ?? "ADMIN_ONLY",
      },
      createdAt: now,
    };

    const creatorMembership: Membership = {
      id: this.deps.idGenerator.next("m"),
      householdId: household.id,
      userId: createdByUserId,
      role: "ADMIN",
      status: "ACTIVE",
      joinedAt: now,
      leftAt: null,
    };

    await this.deps.householdRepository.save(household);
    await this.deps.membershipRepository.save(creatorMembership);

    return {
      household,
      creatorMembership,
    };
  }
}
