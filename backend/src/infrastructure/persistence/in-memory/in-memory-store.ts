import type { Category } from "../../../domain/category.js";
import type { Expense } from "../../../domain/expense.js";
import type { Household } from "../../../domain/household.js";
import type { Membership } from "../../../domain/membership.js";
import type { CategoryParticipationChangeRequest } from "../../../domain/participation-request.js";
import type { MemberCategoryPreference } from "../../../domain/preferences.js";

export interface InMemoryStore {
  households: Map<string, Household>;
  memberships: Map<string, Membership>;
  categories: Map<string, Category>;
  preferences: Map<string, MemberCategoryPreference>;
  participationRequests: Map<string, CategoryParticipationChangeRequest>;
  expenses: Map<string, Expense>;
}

export const createInMemoryStore = (): InMemoryStore => ({
  households: new Map(),
  memberships: new Map(),
  categories: new Map(),
  preferences: new Map(),
  participationRequests: new Map(),
  expenses: new Map(),
});
