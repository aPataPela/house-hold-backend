# V1 REST API Contracts

Base path sugerido: `/api/v1`

Convenciones:
- Fechas: ISO-8601 UTC (`YYYY-MM-DD` o `YYYY-MM-DDTHH:mm:ss.sssZ`).
- Dinero CLP: entero en pesos (`number`).
- Errores: `{ "error": { "code": "...", "message": "..." } }`.

## 1) CreateHousehold
`POST /api/v1/households`

### Request
```json
{
  "name": "Casa Ñuñoa",
  "currency": "CLP",
  "governanceSettings": {
    "categoryParticipationApprovalMode": "ADMIN_ONLY"
  },
  "createdByUserId": "usr_1"
}
```

### Response 201
```json
{
  "householdId": "hh_1",
  "name": "Casa Ñuñoa",
  "currency": "CLP",
  "governanceSettings": {
    "categoryParticipationApprovalMode": "ADMIN_ONLY"
  },
  "createdAt": "2026-02-18T12:00:00.000Z",
  "creatorMembershipId": "m_1"
}
```

## 2) InviteMember / JoinHousehold (simple)
`POST /api/v1/households/{householdId}/memberships`

### Request
```json
{
  "userId": "usr_2",
  "role": "MEMBER",
  "invitedByMembershipId": "m_1"
}
```

### Response 201
```json
{
  "membershipId": "m_2",
  "householdId": "hh_1",
  "userId": "usr_2",
  "role": "MEMBER",
  "status": "ACTIVE",
  "joinedAt": "2026-02-18T12:05:00.000Z"
}
```

## 3) CreateCategory
`POST /api/v1/households/{householdId}/categories`

### Request
```json
{
  "name": "Feria",
  "createdByMembershipId": "m_1"
}
```

### Response 201
```json
{
  "categoryId": "cat_1",
  "householdId": "hh_1",
  "name": "Feria",
  "createdAt": "2026-02-18T12:10:00.000Z"
}
```

## 4) SetMemberCategoryPreference
`PUT /api/v1/households/{householdId}/categories/{categoryId}/preferences/{membershipId}`

### Request
```json
{
  "mode": "INCLUDE_DEFAULT",
  "weight": 0.5,
  "validFrom": "2026-02-01",
  "validTo": null,
  "changedByMembershipId": "m_1"
}
```

### Response 200
```json
{
  "preferenceId": "pref_1",
  "membershipId": "m_7",
  "categoryId": "cat_1",
  "mode": "INCLUDE_DEFAULT",
  "weight": 0.5,
  "validFrom": "2026-02-01",
  "validTo": null
}
```

## 5) RequestTemporaryExclusion
`POST /api/v1/households/{householdId}/category-participation-requests`

### Request
```json
{
  "membershipId": "m_7",
  "categoryId": "cat_1",
  "requestType": "TEMPORARY_EXCLUDE",
  "periodStart": "2026-03-01",
  "periodEnd": "2026-03-20",
  "reason": "Viaje"
}
```

### Response 201
```json
{
  "requestId": "req_1",
  "status": "PENDING",
  "createdAt": "2026-02-18T12:20:00.000Z"
}
```

## 6) ApproveRequest
`POST /api/v1/households/{householdId}/category-participation-requests/{requestId}/decision`

### Request
```json
{
  "decision": "APPROVED",
  "decidedByMembershipId": "m_1",
  "comment": "Ok"
}
```

### Response 200
```json
{
  "requestId": "req_1",
  "status": "APPROVED",
  "decision": {
    "decidedByMembershipId": "m_1",
    "decidedAt": "2026-02-18T12:25:00.000Z",
    "comment": "Ok"
  }
}
```

## 7) RegisterExpense (con items)
`POST /api/v1/households/{householdId}/expenses`

### Request (`AUTO_WEIGHTED`)
```json
{
  "categoryId": "cat_frutos_secos",
  "payerMembershipId": "m_3",
  "date": "2026-02-10",
  "totalAmount": 47000,
  "note": "Compra mensual",
  "items": [
    { "description": "Dátiles", "quantity": 1, "unit": "kg" },
    { "description": "Avena integral", "quantity": 2, "unit": "kg" }
  ],
  "split": {
    "mode": "AUTO_WEIGHTED"
  },
  "actorMembershipId": "m_3"
}
```

### Request (`MANUAL`)
```json
{
  "categoryId": "cat_frutos_secos",
  "payerMembershipId": "m_3",
  "date": "2026-02-10",
  "totalAmount": 47000,
  "items": [
    { "description": "Avena integral", "quantity": 2, "unit": "kg" }
  ],
  "split": {
    "mode": "MANUAL",
    "shares": [
      { "membershipId": "m_1", "assignedAmount": 6715 },
      { "membershipId": "m_2", "assignedAmount": 6714 }
    ]
  },
  "actorMembershipId": "m_3"
}
```

### Response 201
```json
{
  "expenseId": "exp_1",
  "householdId": "hh_1",
  "categoryId": "cat_frutos_secos",
  "payerMembershipId": "m_3",
  "date": "2026-02-10",
  "totalAmount": 47000,
  "status": "ACTIVE",
  "items": [
    { "description": "Dátiles", "quantity": 1, "unit": "kg" },
    { "description": "Avena integral", "quantity": 2, "unit": "kg" }
  ],
  "split": {
    "mode": "AUTO_WEIGHTED",
    "shares": [
      { "membershipId": "m_1", "assignedAmount": 6715, "weightUsed": 1 },
      { "membershipId": "m_7", "assignedAmount": 3357, "weightUsed": 0.5 }
    ]
  },
  "audit": {
    "createdByMembershipId": "m_3",
    "createdAt": "2026-02-18T12:30:00.000Z"
  }
}
```

## 8) GetHouseholdBalance(periodo)
`GET /api/v1/households/{householdId}/balance?from=2026-02-01&to=2026-03-01`

### Response 200
```json
{
  "householdId": "hh_1",
  "period": {
    "from": "2026-02-01",
    "to": "2026-03-01"
  },
  "members": [
    {
      "membershipId": "m_1",
      "paid": 50000,
      "assigned": 13857,
      "netBalance": 36143
    }
  ]
}
```

## 9) ListExpenses(periodo)
`GET /api/v1/households/{householdId}/expenses?from=2026-02-01&to=2026-03-01&limit=50`

### Response 200
```json
{
  "expenses": [
    {
      "expenseId": "exp_1",
      "date": "2026-02-10",
      "categoryId": "cat_frutos_secos",
      "totalAmount": 47000,
      "status": "ACTIVE",
      "split": {
        "mode": "AUTO_WEIGHTED",
        "shares": [
          { "membershipId": "m_1", "assignedAmount": 6715, "weightUsed": 1 }
        ]
      }
    }
  ],
  "page": {
    "limit": 50,
    "nextCursor": "exp_1"
  }
}
```
