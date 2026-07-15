import type { Absence, Balance, ChoreWeek, Expense, MonthlySettlement, Member } from "@/lib/domain";

export type HomeQuickActionId = "expenses" | "absences" | "rules" | "house" | "tasks";

export interface HomeSummaryMetric {
  label: string;
  value: string;
  helperText?: string;
}

export interface HomeExpenseItem {
  expenseId: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  statusLabel: string;
  statusTone: "neutral" | "warning" | "success";
}

export interface HomeAbsenceItem {
  absenceId: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: "neutral" | "warning" | "success";
}

export interface HomeTaskItem {
  taskId: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: "neutral" | "warning" | "success";
}

export interface HomeMovementItem {
  movementId: string;
  kind: "expense" | "absence" | "task" | "presence";
  title: string;
  subtitle: string;
  valueLabel?: string;
}

export interface HomeQuickAction {
  id: HomeQuickActionId;
  label: string;
  description: string;
  tone: "primary" | "secondary";
}

export interface HomeViewModel {
  heroTitle: string;
  heroDescription: string;
  summaryMetrics: HomeSummaryMetric[];
  expenses: HomeExpenseItem[];
  presence: HomeSummaryMetric[];
  upcomingAbsences: HomeAbsenceItem[];
  availableTasks: HomeTaskItem[];
  recentMovements: HomeMovementItem[];
  quickActions: HomeQuickAction[];
  emptyState: boolean;
}

export interface BuildHomeViewModelInput {
  month: string;
  members: Member[];
  expenses: Expense[];
  absences: Absence[];
  settlement: MonthlySettlement | null;
  week: ChoreWeek | null;
  balance: Balance | null;
  currentMembershipId?: string;
}

export function buildHomeViewModel(input: BuildHomeViewModelInput): HomeViewModel {
  const currentMember = input.members.find((member) => member.membershipId === input.currentMembershipId);
  const totalExpenses = input.expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const activeAbsences = input.absences.filter((absence) => absence.status === "ACTIVE");
  const upcomingAbsences = activeAbsences
    .filter((absence) => absence.periodEnd >= currentDate())
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
    .slice(0, 4)
    .map((absence) => ({
      absenceId: absence.absenceId,
      title: memberName(input.members, absence.membershipId),
      subtitle: `${absence.periodStart} → ${absence.periodEnd}${absence.reason ? ` · ${absence.reason}` : ""}`,
      statusLabel: "Activa",
      statusTone: "warning" as const,
    }));

  const availableTasks = (input.week?.tasks ?? [])
    .filter((task) =>
      task.assignments.some(
        (assignment) =>
          assignment.membershipId === input.currentMembershipId && assignment.status === "PENDING",
      ),
    )
    .slice(0, 4)
    .map((task) => ({
      taskId: task.choreTaskId,
      title: task.name,
      subtitle: `${task.assignments.length} asignaciones · límite ${task.assigneeLimit}`,
      statusLabel: task.weeklyStatus === "DONE" ? "Lista" : "Pendiente",
      statusTone: task.weeklyStatus === "DONE" ? ("success" as const) : ("neutral" as const),
    }));

  const recentExpenses = input.expenses
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map((expense) => {
      const share = expense.settlement?.shares.find(
        (item) => item.membershipId === input.currentMembershipId,
      );
      return {
        expenseId: expense.expenseId,
        title: expense.note ?? expense.categoryId,
        subtitle: `${memberName(input.members, expense.payerMembershipId)} · ${expense.date}`,
        amountLabel: formatMoney(expense.totalAmount),
        statusLabel:
          share?.status === "PAID" ? "Pagado" : share?.status === "PARTIAL" ? "Parcial" : "Pendiente",
        statusTone:
          share?.status === "PAID"
            ? ("success" as const)
            : share?.status === "PARTIAL"
              ? ("warning" as const)
              : ("neutral" as const),
      };
    });

  const settlementRow = input.settlement?.members.find(
    (row) => row.membershipId === input.currentMembershipId,
  );
  const currentBalance =
    input.balance?.members.find((member) => member.membershipId === input.currentMembershipId)?.netBalance ?? 0;

  const summaryMetrics: HomeSummaryMetric[] = [
    {
      label: "Gasto del mes",
      value: formatMoney(totalExpenses),
      helperText: `Mes ${input.month}`,
    },
    {
      label: "Saldo personal",
      value: formatBalance(currentBalance),
      helperText: currentMember ? currentMember.userName ?? currentMember.userId : "Cuenta activa",
    },
    {
      label: "Presencia",
      value: `${input.settlement?.totalPresenceDays ?? 0} días`,
      helperText: `${input.settlement?.totalAbsenceDays ?? 0} días ausente`,
    },
    {
      label: "Tareas disponibles",
      value: `${availableTasks.length}`,
      helperText: input.week ? `Semana ${input.week.weekStart}` : "Sin semana generada",
    },
  ];

  const presence: HomeSummaryMetric[] = [
    {
      label: "Presencia mensual",
      value: `${input.settlement?.totalPresenceDays ?? 0} días`,
    },
    {
      label: "Ausencias activas",
      value: `${activeAbsences.length}`,
      helperText: settlementRow
        ? `Tu presencia: ${settlementRow.presenceDays} · tu ausencia: ${settlementRow.absenceDays}`
        : undefined,
    },
  ];

  const recentMovements: HomeMovementItem[] = [
    ...recentExpenses.map((expense) => ({
      movementId: expense.expenseId,
      kind: "expense" as const,
      title: expense.title,
      subtitle: expense.subtitle,
      valueLabel: expense.amountLabel,
    })),
    ...upcomingAbsences.map((absence) => ({
      movementId: absence.absenceId,
      kind: "absence" as const,
      title: absence.title,
      subtitle: absence.subtitle,
    })),
  ].slice(0, 6);

  const quickActions: HomeQuickAction[] = [
    { id: "expenses", label: "Registrar gasto", description: "Crear un nuevo movimiento", tone: "primary" },
    { id: "absences", label: "Ver ausencias", description: "Gestionar presencia mensual", tone: "secondary" },
    { id: "rules", label: "Abrir reglas", description: "Revisar distribución", tone: "secondary" },
    { id: "house", label: "Ir a Casa", description: "Integrantes y tareas", tone: "secondary" },
    { id: "tasks", label: "Tareas", description: "Ver estado semanal", tone: "secondary" },
  ];

  return {
    heroTitle: "La casa en un vistazo",
    heroDescription:
      "Gastos, presencia, ausencias y tareas comparten la misma lectura de convivencia.",
    summaryMetrics,
    expenses: recentExpenses,
    presence,
    upcomingAbsences,
    availableTasks,
    recentMovements,
    quickActions,
    emptyState:
      input.expenses.length === 0 &&
      input.absences.length === 0 &&
      (input.week?.tasks.length ?? 0) === 0,
  };
}

function memberName(members: Member[], membershipId: string): string {
  const member = members.find((item) => item.membershipId === membershipId);
  return member?.userName ?? member?.userId ?? membershipId;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatBalance(value: number): string {
  if (value === 0) return "Estás al día";
  return value > 0 ? `Te deben ${formatMoney(value)}` : `Debes ${formatMoney(Math.abs(value))}`;
}

function currentDate(): string {
  return new Date().toISOString().slice(0, 10);
}
