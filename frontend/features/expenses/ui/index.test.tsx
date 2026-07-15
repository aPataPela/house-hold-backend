import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "@/design-system/theme";
import { ExpenseComposer, ExpenseWorkspace } from "./index";
import type { ExpenseWorkspaceViewModel } from "../domain";

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider houseThemeId="patagonia">{ui}</ThemeProvider>);
}

const viewModel: ExpenseWorkspaceViewModel = {
  month: "2026-07",
  categories: [{ categoryId: "cat-1", label: "Supermercado" }],
  members: [
    { membershipId: "m1", label: "Ana", available: true },
    { membershipId: "m2", label: "Bea", available: false, reason: "Ausente este mes" },
  ],
  preview: {
    categoryId: "cat-1",
    categoryName: "Supermercado",
    month: "2026-07",
    totalAmount: 300000,
    totalWeight: 1.5,
    rows: [
      {
        membershipId: "m1",
        displayName: "Ana",
        presenceDays: 31,
        absenceDays: 0,
        ruleMode: "INCLUDE_DEFAULT",
        weightUsed: 1,
        effectiveWeight: 1,
        assignedAmount: 200000,
        explanation: "Participa con presencia completa en el mes.",
      },
    ],
    exclusions: [
      {
        membershipId: "m2",
        displayName: "Bea",
        reason: "Excluida por regla de categoría.",
      },
    ],
  },
  expenses: [
    {
      expenseId: "e1",
      categoryName: "Supermercado",
      payerName: "Ana",
      date: "2026-07-12",
      totalAmountLabel: "$300.000",
      statusLabel: "Pendiente",
      statusTone: "neutral",
      currentShareLabel: "Quedan $100.000 por pagar",
    },
  ],
  settlement: {
    month: "2026-07",
    totalAmountLabel: "$300.000",
    dailyAmountLabel: "$10.000",
    totalPresenceDays: 60,
    totalAbsenceDays: 2,
    rows: [
      {
        membershipId: "m1",
        displayName: "Ana",
        memberDays: 31,
        presenceDays: 31,
        absenceDays: 0,
        assignedAmountLabel: "$160.000",
        presenceLabel: "31 días presentes",
        absenceLabel: "0 días ausente",
      },
    ],
  },
  emptyState: false,
  canRegisterPayments: true,
};

describe("expenses ui", () => {
  it("renders the workspace from view models", () => {
    renderWithTheme(
      <ExpenseWorkspace
        viewModel={viewModel}
        categoryId="cat-1"
        totalAmount="300000"
        draftDate="2026-07-12"
        onCategoryChange={() => undefined}
        onTotalAmountChange={() => undefined}
        onDraftDateChange={() => undefined}
        onGeneratePreview={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(screen.getByText(/crear gasto/i)).toBeInTheDocument();
    expect(screen.getByText(/preview de reparto/i)).toBeInTheDocument();
    expect(screen.getByText(/liquidación mensual/i)).toBeInTheDocument();
  });

  it("renders a composer without doing any amount logic in the component", () => {
    renderWithTheme(
      <ExpenseComposer
        categoryId="cat-1"
        totalAmount="300000"
        draftDate="2026-07-12"
        viewModel={viewModel}
        onCategoryChange={() => undefined}
        onTotalAmountChange={() => undefined}
        onDraftDateChange={() => undefined}
        onGeneratePreview={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirmar y guardar/i })).toBeInTheDocument();
  });
});
