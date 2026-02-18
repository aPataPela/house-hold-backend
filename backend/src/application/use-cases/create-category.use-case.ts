import type { Category } from "../../domain/category.js";
import { ConflictError, NotFoundError, ValidationError } from "../errors.js";
import type {
  CategoryRepository,
  HouseholdRepository,
  MembershipRepository,
} from "../ports/repositories.js";
import type { Clock, IdGenerator } from "../ports/services.js";

export interface CreateCategoryInput {
  householdId: string;
  name: string;
  createdByMembershipId: string;
}

export interface CreateCategoryResult {
  category: Category;
}

interface CreateCategoryDependencies {
  householdRepository: HouseholdRepository;
  membershipRepository: MembershipRepository;
  categoryRepository: CategoryRepository;
  idGenerator: IdGenerator;
  clock: Clock;
}

export class CreateCategoryUseCase {
  constructor(private readonly deps: CreateCategoryDependencies) {}

  async execute(input: CreateCategoryInput): Promise<CreateCategoryResult> {
    const householdId = input.householdId?.trim();
    const name = input.name?.trim();
    const createdByMembershipId = input.createdByMembershipId?.trim();

    if (!householdId) {
      throw new ValidationError("householdId is required");
    }

    if (!name) {
      throw new ValidationError("name is required");
    }

    if (!createdByMembershipId) {
      throw new ValidationError("createdByMembershipId is required");
    }

    const household = await this.deps.householdRepository.findById(householdId);
    if (!household) {
      throw new NotFoundError("household not found");
    }

    const creatorMembership = await this.deps.membershipRepository.findById(createdByMembershipId);
    if (!creatorMembership || creatorMembership.householdId !== household.id) {
      throw new NotFoundError("createdByMembership not found in household");
    }

    if (creatorMembership.status !== "ACTIVE") {
      throw new ValidationError("createdByMembership must be ACTIVE");
    }

    const duplicated = await this.deps.categoryRepository.findByHouseholdAndNormalizedName(
      household.id,
      normalizeCategoryName(name),
    );

    if (duplicated) {
      throw new ConflictError("category name already exists in household");
    }

    const category: Category = {
      id: this.deps.idGenerator.next("cat"),
      householdId: household.id,
      name,
      status: "ACTIVE",
      createdAt: this.deps.clock.now(),
    };

    await this.deps.categoryRepository.save(category);

    return {
      category,
    };
  }
}

const normalizeCategoryName = (name: string): string => name.trim().toLowerCase();
