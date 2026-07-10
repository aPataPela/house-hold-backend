"use client";

import { Plus, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import type { Category, Expense } from "@/lib/domain";
import { formatShortDate } from "@/lib/date";
import { formatCurrency } from "@/lib/format";

type ExpenseListProps = {
  expenses: Expense[];
  categoryName: (id: string) => string;
  memberName: (id: string) => string;
  emptyText?: string;
};

export function ExpenseList({
  expenses,
  categoryName,
  memberName,
  emptyText = "No hay gastos en este período.",
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className="expense-list">
      {expenses.map((expense) => (
        <article className="expense-row" key={expense.expenseId}>
          <span className="row-icon" aria-hidden="true">
            <ReceiptText size={19} />
          </span>
          <div className="expense-main">
            <h3>{categoryName(expense.categoryId)}</h3>
            <p>
              {memberName(expense.payerMembershipId)} ·{" "}
              {formatShortDate(expense.date)}
            </p>
            {expense.note && <p className="expense-note">{expense.note}</p>}
          </div>
          <strong>{formatCurrency(expense.totalAmount)}</strong>
        </article>
      ))}
    </div>
  );
}

type ExpensesViewProps = {
  expenses: Expense[];
  categories: Category[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onOpenExpense: () => void;
  categoryName: (id: string) => string;
  memberName: (id: string) => string;
};

export function ExpensesView({
  expenses,
  categories,
  selectedMonth,
  onMonthChange,
  onOpenExpense,
  categoryName,
  memberName,
}: ExpensesViewProps) {
  const [categoryId, setCategoryId] = useState("all");
  const filteredExpenses = useMemo(
    () =>
      expenses.filter(
        (expense) => categoryId === "all" || expense.categoryId === categoryId,
      ),
    [categoryId, expenses],
  );
  const total = filteredExpenses.reduce(
    (sum, expense) => sum + expense.totalAmount,
    0,
  );

  return (
    <section data-tutorial="expenses">
      <div className="page-heading with-action">
        <div>
          <p className="eyebrow">Movimientos</p>
          <h2>Gastos de la casa</h2>
        </div>
        <button
          className="icon-action primary-icon"
          type="button"
          aria-label="Registrar gasto"
          title="Registrar gasto"
          onClick={onOpenExpense}
        >
          <Plus size={21} />
        </button>
      </div>

      <div className="filter-bar">
        <label>
          Mes
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
          />
        </label>
        <label>
          Categoría
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option value={category.categoryId} key={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="list-summary">
        <span>{filteredExpenses.length} movimientos</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
      <ExpenseList
        expenses={filteredExpenses}
        categoryName={categoryName}
        memberName={memberName}
      />
    </section>
  );
}
