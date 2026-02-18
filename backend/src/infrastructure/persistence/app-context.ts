import type {
  CategoryParticipationChangeRequestRepository,
  CategoryRepository,
  ExpenseRepository,
  HouseholdBalanceReadModel,
  HouseholdRepository,
  MemberCategoryPreferenceRepository,
  MembershipRepository,
} from "../../application/ports/repositories.js";

export interface ApplicationRepositories {
  householdRepository: HouseholdRepository;
  membershipRepository: MembershipRepository;
  categoryRepository: CategoryRepository;
  memberCategoryPreferenceRepository: MemberCategoryPreferenceRepository;
  participationChangeRequestRepository: CategoryParticipationChangeRequestRepository;
  expenseRepository: ExpenseRepository;
  householdBalanceReadModel: HouseholdBalanceReadModel;
}

export interface AppContext {
  kind: "in-memory" | "mongo";
  repositories: ApplicationRepositories;
  dispose?: () => Promise<void>;
}
