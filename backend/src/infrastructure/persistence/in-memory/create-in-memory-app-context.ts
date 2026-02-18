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
import type { AppContext } from "../app-context.js";

export interface InMemoryAppContext extends AppContext {
  kind: "in-memory";
  store: ReturnType<typeof createInMemoryStore>;
}

export const createInMemoryAppContext = (): InMemoryAppContext => {
  const store = createInMemoryStore();

  return {
    kind: "in-memory",
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
