# V1 Backend Architecture (Node + TypeScript)

## Decisión técnica (C)
Se propone **Node.js + TypeScript sin framework pesado** (HTTP adapter minimal).

Razón breve:
- Escala inicial baja/media (12 -> 200 usuarios) con foco en costo y simplicidad operativa.
- Dominio y casos de uso desacoplados de transporte/persistencia.
- Migrable luego a Express/Fastify/Nest sin tocar reglas de dominio.

## Estructura de proyecto propuesta (C)
```text
backend/
  package.json
  tsconfig.json
  src/
    domain/
      expense.ts
      household.ts
      membership.ts
      category.ts
      preferences.ts
      participation-request.ts
      services/
        weighted-split-calculator.ts
    application/
      errors.ts
      ports/
        repositories.ts
        services.ts
      use-cases/
        register-expense.use-case.ts
    infrastructure/
      http/
        routes.md
  tests/
    weighted-split-calculator.test.mjs
    register-expense.use-case.test.mjs
```

## Diseño por capas y módulos (D)
- `domain/`
  - Entidades y reglas puras.
  - Sin dependencias de framework/DB.
  - Servicio de dominio: `WeightedSplitCalculator`.

- `application/`
  - Orquestación de casos de uso.
  - Validaciones de entrada y políticas transversales.
  - Depende de puertos (`interfaces`) y del dominio.

- `infrastructure/`
  - Adaptadores concretos (HTTP, Mongo, Firestore, etc.).
  - Implementa interfaces de repositorio.

## Interfaces de repositorio (D)
Definidas en `backend/src/application/ports/repositories.ts`.

Principales:
- `HouseholdRepository`
- `MembershipRepository`
- `CategoryRepository`
- `MemberCategoryPreferenceRepository`
- `CategoryParticipationChangeRequestRepository`
- `ExpenseRepository`

Servicios de aplicación:
- `IdGenerator`
- `Clock`

## Inmutabilidad e histórico
- `Expense.split.shares` se persiste como snapshot.
- Cambios de preferencias/exclusiones futuras no alteran shares pasados.
- Cancelación de gastos se modela por `status`.
