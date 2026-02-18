import { NotFoundError, ValidationError } from "../errors.js";
import type {
  HouseholdBalanceReadModel,
  HouseholdBalanceRow,
  HouseholdRepository,
} from "../ports/repositories.js";

export interface GetHouseholdBalanceInput {
  householdId: string;
  from: string;
  to: string;
}

export interface GetHouseholdBalanceResult {
  householdId: string;
  period: {
    from: string;
    to: string;
  };
  members: HouseholdBalanceRow[];
}

interface GetHouseholdBalanceDependencies {
  householdRepository: HouseholdRepository;
  householdBalanceReadModel: HouseholdBalanceReadModel;
}

export class GetHouseholdBalanceUseCase {
  constructor(private readonly deps: GetHouseholdBalanceDependencies) {}

  async execute(input: GetHouseholdBalanceInput): Promise<GetHouseholdBalanceResult> {
    const householdId = asRequiredTrimmed(input.householdId, "householdId");
    const from = parseIsoDate(input.from, "from");
    const to = parseIsoDate(input.to, "to");

    if (from >= to) {
      throw new ValidationError("from must be before to");
    }

    const household = await this.deps.householdRepository.findById(householdId);
    if (!household) {
      throw new NotFoundError("household not found");
    }

    const members = await this.deps.householdBalanceReadModel.getBalance(household.id, {
      from,
      to,
    });

    return {
      householdId: household.id,
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      members: members.sort((a, b) => a.membershipId.localeCompare(b.membershipId)),
    };
  }
}

const parseIsoDate = (value: string, field: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${field} must be a valid ISO date`);
  }

  return parsed;
};

const asRequiredTrimmed = (value: string, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`);
  }

  return value.trim();
};
