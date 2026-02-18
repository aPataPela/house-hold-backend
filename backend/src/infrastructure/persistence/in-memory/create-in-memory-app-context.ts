import { createInMemoryStore } from "./in-memory-store.js";
import {
  InMemoryCategoryParticipationChangeRequestRepository,
  InMemoryCategoryRepository,
  InMemoryExpenseRepository,
  InMemoryHouseholdBalanceReadModel,
  InMemoryHouseholdRepository,
  InMemoryMemberCategoryPreferenceRepository,
  InMemoryMembershipRepository,
} from "./in-memory-repositories.js";

export const createInMemoryAppContext = () => {
  const store = createInMemoryStore();

  return {
    store,
    repositories: {
      householdRepository: new InMemoryHouseholdRepository(store),
      membershipRepository: new InMemoryMembershipRepository(store),
      categoryRepository: new InMemoryCategoryRepository(store),
      memberCategoryPreferenceRepository: new InMemoryMemberCategoryPreferenceRepository(store),
      participationChangeRequestRepository:
        new InMemoryCategoryParticipationChangeRequestRepository(store),
      expenseRepository: new InMemoryExpenseRepository(store),
      householdBalanceReadModel: new InMemoryHouseholdBalanceReadModel(store),
    },
  };
};

export type InMemoryAppContext = ReturnType<typeof createInMemoryAppContext>;
