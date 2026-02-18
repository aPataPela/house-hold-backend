# HTTP route -> use case mapping (adapter sketch)

- `GET /health` -> healthcheck
- `GET /api/v1` -> api info
- `GET /api/v1/health` -> api healthcheck
- `POST /api/v1/households` -> `CreateHousehold` (implemented)
- `POST /api/v1/households/:householdId/memberships` -> `InviteMember` (implemented)
- `POST /api/v1/households/:householdId/categories` -> `CreateCategory` (implemented)
- `PUT /api/v1/households/:householdId/categories/:categoryId/preferences/:membershipId` -> `SetMemberCategoryPreference` (implemented)
- `POST /api/v1/households/:householdId/category-participation-requests` -> `RequestTemporaryExclusion` (implemented)
- `POST /api/v1/households/:householdId/category-participation-requests/:requestId/decision` -> `ApproveRequest` (implemented)
- `POST /api/v1/households/:householdId/expenses` -> `RegisterExpense`
- `GET /api/v1/households/:householdId/balance` -> `GetHouseholdBalance`
- `GET /api/v1/households/:householdId/expenses` -> `ListExpenses`
