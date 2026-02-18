import type { MongoDb } from "./mongo-repositories.js";

export const ensureMongoIndexes = async (database: MongoDb): Promise<void> => {
  const expenses = database.collection("expenses");
  const memberships = database.collection("memberships");
  const preferences = database.collection("member_category_preferences");
  const requests = database.collection("category_participation_change_requests");
  const categories = database.collection("categories");

  await Promise.all([
    expenses.createIndex(
      { householdId: 1, date: -1, status: 1, _id: -1 },
      { name: "expenses_household_date_status_cursor" },
    ),
    expenses.createIndex(
      { householdId: 1, categoryId: 1, date: -1, status: 1, _id: -1 },
      { name: "expenses_household_category_date_status_cursor" },
    ),
    expenses.createIndex(
      { householdId: 1, payerMembershipId: 1, date: 1, status: 1 },
      { name: "expenses_household_payer_date_status" },
    ),
    expenses.createIndex(
      { householdId: 1, "split.shares.membershipId": 1, date: 1, status: 1 },
      { name: "expenses_household_sharemember_date_status" },
    ),
    memberships.createIndex(
      { householdId: 1, status: 1, userId: 1 },
      { name: "memberships_household_status_user" },
    ),
    preferences.createIndex(
      { householdId: 1, categoryId: 1, membershipId: 1, validFrom: 1, validTo: 1 },
      { name: "preferences_household_category_member_validity" },
    ),
    requests.createIndex(
      {
        householdId: 1,
        categoryId: 1,
        membershipId: 1,
        status: 1,
        periodStart: 1,
        periodEnd: 1,
      },
      { name: "requests_household_category_member_status_period" },
    ),
    categories.createIndex(
      { householdId: 1, normalizedName: 1 },
      { name: "categories_household_normalized_name", unique: true },
    ),
  ]);
};
