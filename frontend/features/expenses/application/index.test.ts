import { describe, expect, it, vi } from "vitest";
import {
  ExpenseApplicationError,
  buildExpensePreviewViewModel,
  createExpenseUseCase,
  createRegisterPaymentUseCase,
} from "./index";

const members = [
  {
    membershipId: "m1",
    householdId: "h1",
    displayName: "Ana",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    livingSince: "2026-01-01",
  },
  {
    membershipId: "m2",
    householdId: "h1",
    displayName: "Bea",
    role: "MEMBER" as const,
    status: "ACTIVE" as const,
    livingSince: "2026-01-01",
  },
];

const categories = [
  {
    categoryId: "cat-1",
    householdId: "h1",
    name: "Supermercado",
    status: "ACTIVE" as const,
    createdByMembershipId: "m1",
    createdAt: "2026-07-01T00:00:00.000Z",
  },
];

const settlement = {
  householdId: "h1",
  month: "2026-07",
  totalAmount: 300000,
  daysInMonth: 31,
  totalMemberDays: 62,
  totalAbsenceDays: 2,
  totalPresenceDays: 60,
  dailyAmount: 10000,
  members: [
    {
      membershipId: "m1",
      displayName: "Ana",
      memberDays: 31,
      absenceDays: 0,
      presenceDays: 31,
      assignedAmount: 160000,
    },
    {
      membershipId: "m2",
      displayName: "Bea",
      memberDays: 31,
      absenceDays: 2,
      presenceDays: 29,
      assignedAmount: 140000,
    },
  ],
};

describe("expenses application", () => {
  it("builds a preview from domain data", () => {
    const preview = buildExpensePreviewViewModel({
      actor: { membershipId: "m1", role: "MEMBER" },
      draft: { categoryId: "cat-1", date: "2026-07-12", totalAmount: 300000 },
      members,
      categories,
      settlement,
      rules: [],
    });

    expect(preview.rows).toHaveLength(2);
  });

  it("creates an expense after previewing", async () => {
    const createExpense = vi.fn(async () => ({
      expenseId: "e1",
      householdId: "h1",
      categoryId: "cat-1",
      payerMembershipId: "m1",
      date: "2026-07-12",
      totalAmount: 300000,
      status: "ACTIVE" as const,
      split: { mode: "AUTO_WEIGHTED" as const, shares: [] },
      audit: {
        createdByMembershipId: "m1",
        createdAt: "2026-07-12T00:00:00.000Z",
        updatedAt: "2026-07-12T00:00:00.000Z",
      },
    }));

    const execute = createExpenseUseCase({
      preview: buildExpensePreviewViewModel,
      createExpense,
    });

    const result = await execute({
      actor: { membershipId: "m1", role: "MEMBER" },
      payerMembershipId: "m1",
      draft: { categoryId: "cat-1", date: "2026-07-12", totalAmount: 300000 },
      members,
      categories,
      settlement,
      rules: [],
    });

    expect(result.preview.rows.length).toBeGreaterThan(0);
    expect(createExpense).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid payment amounts", async () => {
    const execute = createRegisterPaymentUseCase({
      registerPayment: vi.fn(),
    });

    await expect(
      execute({
        expenseId: "e1",
        payment: { membershipId: "m1", amount: 400000 },
        expenses: [
          {
            expenseId: "e1",
            householdId: "h1",
            categoryId: "cat-1",
            payerMembershipId: "m1",
            date: "2026-07-12",
            totalAmount: 300000,
            status: "ACTIVE",
            split: { mode: "AUTO_WEIGHTED", shares: [] },
            settlement: {
              payments: [],
              shares: [
                {
                  membershipId: "m1",
                  displayName: "Ana",
                  assignedAmount: 100000,
                  weightUsed: 1,
                  paidAmount: 0,
                  remainingAmount: 100000,
                  status: "PENDING",
                  presenceDays: 31,
                  absenceDays: 0,
                  ruleMode: "INCLUDE_DEFAULT",
                  explanation: "Participa con presencia completa en el mes.",
                },
              ],
            },
            audit: {
              createdByMembershipId: "m1",
              createdAt: "2026-07-12T00:00:00.000Z",
              updatedAt: "2026-07-12T00:00:00.000Z",
            },
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ExpenseApplicationError);
  });
});
