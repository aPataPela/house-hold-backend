"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  CalendarOff,
  House,
  Plus,
  ReceiptText,
  Scale,
  WalletCards,
} from "lucide-react";
import type {
  Absence,
  ChoreWeek,
  Expense,
  MonthlySettlement,
} from "@/lib/domain";
import { formatBalance, formatCurrency } from "@/lib/format";
import { ExpenseList } from "@/features/expenses/expenses-view";

type HomeViewProps = {
  currentBalance: number;
  expenses: Expense[];
  absences: Absence[];
  settlement: MonthlySettlement | null;
  week: ChoreWeek | null;
  categoryName: (id: string) => string;
  memberName: (id: string) => string;
  currentMembershipId?: string;
  onOpenExpense: () => void;
  onGoToExpenses: () => void;
  onGoToAbsences: () => void;
  onGoToHouse: () => void;
  onGoToRules: () => void;
  onPayExpense?: (expense: Expense) => void;
};

export function HomeView({
  currentBalance,
  expenses,
  absences,
  settlement,
  week,
  categoryName,
  memberName,
  currentMembershipId,
  onOpenExpense,
  onGoToExpenses,
  onGoToAbsences,
  onGoToHouse,
  onGoToRules,
  onPayExpense,
}: HomeViewProps) {
  const total = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const activeAbsences = absences.filter(
    (absence) => absence.status === "ACTIVE",
  );
  const absenceDays = settlement?.totalAbsenceDays ?? 0;
  const totalTasks = week?.tasks.length ?? 0;
  const doneTasks =
    week?.tasks.filter((task) => task.weeklyStatus === "DONE").length ?? 0;

  return (
    <section data-tutorial="home" className="home-dashboard">
      <div className="page-heading">
        <p className="eyebrow">Panel central</p>
        <h2>La casa en un vistazo</h2>
      </div>

      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-hero-badge">Convivencia activa</span>
          <h3>Gastos, ausencias y tareas viven en el mismo tablero.</h3>
          <p>
            La casa se entiende mejor cuando la presencia, la carga económica y
            la operativa aparecen juntas.
          </p>
          <div className="home-hero-actions">
            <button type="button" className="primary-action" onClick={onOpenExpense}>
              <Plus size={18} /> Registrar gasto
            </button>
            <button className="soft-action" type="button" onClick={onGoToAbsences}>
              <CalendarOff size={18} /> Ver ausencias
            </button>
          </div>
        </div>
        <div className="home-hero-orb" aria-hidden="true">
          <WalletCards size={34} />
        </div>
      </section>

      <div className="home-grid">
        <article className="home-card home-card-accent">
          <div className="home-card-head">
            <span>Convivencia</span>
            <Scale size={18} aria-hidden="true" />
          </div>
          <strong>{formatBalance(currentBalance)}</strong>
          <p>{formatCurrency(settlement?.totalAmount ?? total)} en el mes</p>
          <button className="text-action" type="button" onClick={onGoToRules}>
            Ver reparto <ArrowUpRight size={15} />
          </button>
        </article>

        <button className="home-card home-card-button" type="button" onClick={onGoToAbsences}>
          <div className="home-card-head">
            <span>Ausencias</span>
            <CalendarOff size={18} aria-hidden="true" />
          </div>
          <strong>{activeAbsences.length}</strong>
          <p>{absenceDays} días fuera este mes</p>
          <span className="home-card-link">
            Abrir calendario <ArrowUpRight size={15} />
          </span>
        </button>

        <button className="home-card home-card-button" type="button" onClick={onGoToHouse}>
          <div className="home-card-head">
            <span>Tareas</span>
            <BadgeCheck size={18} aria-hidden="true" />
          </div>
          <strong>{doneTasks}</strong>
          <p>
            {totalTasks > 0
              ? `de ${totalTasks} tareas listas en la semana`
              : "Todavía no hay semana generada"}
          </p>
          <span className="home-card-link">
            Abrir panel <ArrowUpRight size={15} />
          </span>
        </button>
      </div>

      <div className="metric-grid">
        <article className="metric-block">
          <ReceiptText size={20} aria-hidden="true" />
          <span>Gasto del mes</span>
          <strong>{formatCurrency(total)}</strong>
        </article>
        <article className="metric-block">
          <House size={20} aria-hidden="true" />
          <span>Presencia efectiva</span>
          <strong>{settlement?.totalPresenceDays ?? 0} días</strong>
        </article>
      </div>

      <div className="section-header">
        <h3>Últimos gastos</h3>
        <button className="text-action" type="button" onClick={onGoToExpenses}>
          Ver todos
        </button>
      </div>
      <ExpenseList
        expenses={expenses.slice(0, 3)}
        categoryName={categoryName}
        memberName={memberName}
        currentMembershipId={currentMembershipId}
        onPayExpense={onPayExpense}
        emptyText="Registra el primer gasto de este mes."
      />
    </section>
  );
}
