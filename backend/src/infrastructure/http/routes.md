# HTTP route -> use case mapping (adapter sketch)

- `POST /api/v1/households` -> `CreateHousehold`
- `POST /api/v1/households/:householdId/memberships` -> `InviteMember`
- `POST /api/v1/households/:householdId/categories` -> `CreateCategory`
- `PUT /api/v1/households/:householdId/categories/:categoryId/preferences/:membershipId` -> `SetMemberCategoryPreference`
- `POST /api/v1/households/:householdId/category-participation-requests` -> `RequestTemporaryExclusion`
- `POST /api/v1/households/:householdId/category-participation-requests/:requestId/decision` -> `ApproveRequest`
- `POST /api/v1/households/:householdId/expenses` -> `RegisterExpense`
- `GET /api/v1/households/:householdId/balance` -> `GetHouseholdBalance`
- `GET /api/v1/households/:householdId/expenses` -> `ListExpenses`
