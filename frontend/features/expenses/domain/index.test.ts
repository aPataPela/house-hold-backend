import { describe, expect, it } from "vitest";
import {
  buildExpenseListItemViewModel,
  buildMonthlySettlementViewModel,
  createExpenseDistributionPolicy,
} from "./index";

describe("expenses domain", () => {
  it("builds a preview with presence-based adjustments", () => {
    const preview = createExpenseDistributionPolicy().preview({
      category: {
        categoryId: "cat-1",
        householdId: "h1",
        name: "Supermercado",
        status: "ACTIVE",
        createdByMembershipId: "m1",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
      members: [
        {
          membershipId: "m1",
          householdId: "h1",
          displayName: "Ana",
          role: "MEMBER",
          status: "ACTIVE",
          livingSince: "2026-01-01",
        },
        {
          membershipId: "m2",
          householdId: "h1",
          displayName: "Bea",
          role: "MEMBER",
          status: "ACTIVE",
          livingSince: "2026-01-01",
        },
      ],
      rules: [
        {
          preferenceId: "r1",
          householdId: "h1",
          categoryId: "cat-1",
          membershipId: "m2",
          mode: "HALF",
          weight: 0.5,
          validFrom: "2026-07-01",
          validTo: null,
          changedByMembershipId: "m1",
          changedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      settlement: {
        householdId: "h1",
        month: "2026-07",
        totalAmount: 310000,
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
            assignedAmount: 150000,
          },
        ],
      },
      draft: {
        categoryId: "cat-1",
        date: "2026-07-12",
        totalAmount: 300000,
      },
    });

    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[1]?.explanation).toContain("media participación");
    expect(preview.rows[1]?.assignedAmount).toBeGreaterThan(0);
  });

  it("maps monthly settlement to a view model", () => {
    const viewModel = buildMonthlySettlementViewModel({
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
      ],
    });

    expect(viewModel?.rows[0]?.assignedAmountLabel).toContain("$");
  });

  it("builds a list item view model with payment status", () => {
    const item = buildExpenseListItemViewModel(
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
              paidAmount: 50000,
              remainingAmount: 50000,
              status: "PARTIAL",
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
      () => "Ana",
      () => "Mercado",
    );

    expect(item.statusLabel).toBe("Parcial");
    expect(item.currentShareLabel).toContain("Quedan");
  });
});
