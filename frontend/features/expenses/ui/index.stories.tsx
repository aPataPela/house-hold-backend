import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "@/design-system/theme";
import { ExpenseWorkspace } from "./index";
import type { ExpenseWorkspaceViewModel } from "../domain";

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

const meta = {
  title: "Features/Expenses/ExpenseWorkspace",
  component: ExpenseWorkspace,
  decorators: [
    (Story: React.ComponentType) => (
      <ThemeProvider houseThemeId="patagonia">
        <div style={{ padding: 24, maxWidth: 980 }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ExpenseWorkspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    viewModel,
    categoryId: "cat-1",
    totalAmount: "300000",
    draftDate: "2026-07-12",
    onCategoryChange: () => undefined,
    onTotalAmountChange: () => undefined,
    onDraftDateChange: () => undefined,
    onGeneratePreview: () => undefined,
    onConfirm: () => undefined,
  },
};
