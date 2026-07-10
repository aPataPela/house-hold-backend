"use client";

import {
  ArrowRight,
  Plus,
  ReceiptText,
  Scale,
  WalletCards,
} from "lucide-react";
import type { Expense } from "@/lib/domain";
import { formatBalance, formatCurrency } from "@/lib/format";
import { ExpenseList } from "@/features/expenses/expenses-view";

type HomeViewProps = {
  currentBalance: number;
  expenses: Expense[];
  categoryName: (id: string) => string;
  memberName: (id: string) => string;
  currentMembershipId?: string;
  onOpenExpense: () => void;
  onGoToExpenses: () => void;
  onGoToRules: () => void;
  onPayExpense?: (expense: Expense) => void;
};

export function HomeView({
  currentBalance,
  expenses,
  categoryName,
  memberName,
  currentMembershipId,
  onOpenExpense,
  onGoToExpenses,
  onGoToRules,
  onPayExpense,
}: HomeViewProps) {
  const total = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);

  return (
    <section data-tutorial="home">
      <div className="page-heading">
        <p className="eyebrow">Este mes</p>
        <h2>Tu resumen</h2>
      </div>

      <section className="balance-band">
        <div>
          <span>Tu saldo</span>
          <strong>{formatBalance(currentBalance)}</strong>
        </div>
        <WalletCards size={30} aria-hidden="true" />
      </section>

      <button
        className="primary-action full-action register-action"
        onClick={onOpenExpense}
      >
        <Plus size={20} /> Registrar gasto
      </button>

      <div className="metric-grid">
        <article className="metric-block">
          <ReceiptText size={20} aria-hidden="true" />
          <span>Gasto del mes</span>
          <strong>{formatCurrency(total)}</strong>
        </article>
        <button
          className="metric-block rule-shortcut"
          type="button"
          onClick={onGoToRules}
        >
          <Scale size={20} aria-hidden="true" />
          <span>Reparto</span>
          <strong>
            Ver reglas <ArrowRight size={16} />
          </strong>
        </button>
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
