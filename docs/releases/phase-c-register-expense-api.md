# Phase C RegisterExpense API - Release Note

Fecha: 2026-02-18
Rama: `phase/c-register-expense-api`

## Objetivo de fase
Conectar el caso de uso `RegisterExpense` al adapter HTTP y validar el flujo completo por endpoint.

## Alcance cerrado
- `POST /api/v1/households/:householdId/expenses`
  - soporta `split.mode = AUTO_WEIGHTED`
  - soporta `split.mode = MANUAL`
  - soporta `items` informativos
  - persiste y devuelve snapshot de `split.shares`

## Reglas aplicadas en endpoint
- `totalAmount` entero positivo en CLP.
- `split.mode` permitido: `AUTO_WEIGHTED | MANUAL`.
- `MANUAL` requiere `shares[]` con `assignedAmount` entero >= 0.
- validaciones de dominio y orquestación delegadas a `RegisterExpenseUseCase`.

## Validación ejecutada
```bash
cd backend
npm run typecheck
npm run test
```

Resultado:
- typecheck en verde.
- tests en verde (smoke HTTP + integración Fase A/B/C + unit tests de reparto).

## Próxima fase
Fase D:
- `GET /households/{householdId}/expenses`
- `GET /households/{householdId}/balance`
