"use client";

import { memo } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Select,
  TextField,
} from "@/design-system";
import type {
  ExpenseListItemViewModel,
  ExpensePreview,
  ExpenseWorkspaceViewModel,
  MonthlySettlementViewModel,
} from "../domain";

export interface ExpenseComposerProps {
  categoryId: string;
  totalAmount: string;
  draftDate: string;
  loading?: boolean;
  viewModel: ExpenseWorkspaceViewModel;
  onCategoryChange: (categoryId: string) => void;
  onTotalAmountChange: (value: string) => void;
  onDraftDateChange: (value: string) => void;
  onGeneratePreview: () => void;
  onConfirm: () => void;
}

export const ExpenseComposer = memo(function ExpenseComposer({
  categoryId,
  totalAmount,
  draftDate,
  loading = false,
  viewModel,
  onCategoryChange,
  onTotalAmountChange,
  onDraftDateChange,
  onGeneratePreview,
  onConfirm,
}: ExpenseComposerProps) {
  return (
    <Card padding="lg">
      <div className="ds-section-stack">
        <div className="ds-section-header">
          <strong>Crear gasto</strong>
          <span className="ds-field-hint">El reparto se calcula fuera del componente.</span>
        </div>

        <div className="ds-grid-2">
          <Select
            label="Categoría"
            value={categoryId}
            options={viewModel.categories.map((category) => ({
              value: category.categoryId,
              label: category.label,
            }))}
            onChange={(event) => onCategoryChange(event.target.value)}
          />

          <TextField
            label="Monto total"
            type="number"
            inputMode="numeric"
            value={totalAmount}
            onChange={(event) => onTotalAmountChange(event.target.value)}
          />
        </div>

        <TextField label="Fecha" type="date" value={draftDate} onChange={(event) => onDraftDateChange(event.target.value)} />

        <div className="ds-compact-stack">
          <Button type="button" variant="secondary" onClick={onGeneratePreview} disabled={loading}>
            Ver preview
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading}>
            Confirmar y guardar
          </Button>
        </div>

        <ExpensePreviewCard preview={viewModel.preview} />
      </div>
    </Card>
  );
});
ExpenseComposer.displayName = "ExpenseComposer";

export interface ExpensePreviewCardProps {
  preview: ExpensePreview | null;
}

export const ExpensePreviewCard = memo(function ExpensePreviewCard({ preview }: ExpensePreviewCardProps) {
  if (!preview) {
    return (
      <EmptyState
        title="Sin preview todavía"
        description="Selecciona categoría, monto y fecha para ver el reparto."
      />
    );
  }

  return (
    <Card padding="lg">
      <div className="ds-section-stack">
        <div className="ds-section-header">
          <strong>Preview de reparto</strong>
          <Badge tone="neutral">{preview.categoryName}</Badge>
        </div>

        <div className="ds-summary-grid">
          <SummaryMetric label="Mes" value={preview.month} />
          <SummaryMetric label="Monto" value={formatMoney(preview.totalAmount)} />
          <SummaryMetric label="Peso total" value={preview.totalWeight.toFixed(2)} />
        </div>

        <div className="ds-preview-list">
          {preview.rows.map((row) => (
            <Card key={row.membershipId} padding="sm">
              <div className="ds-row-between">
                <strong>{row.displayName}</strong>
                <Badge tone="success">{formatMoney(row.assignedAmount)}</Badge>
              </div>
              <p className="ds-field-hint">{row.explanation}</p>
              <p className="ds-field-hint">
                {row.presenceDays} días presentes · {row.absenceDays} días ausente
              </p>
            </Card>
          ))}
        </div>

        {preview.exclusions.length > 0 ? (
          <div className="ds-preview-list">
            {preview.exclusions.map((item) => (
              <Card key={item.membershipId} padding="sm">
                <div className="ds-row-between">
                  <strong>{item.displayName}</strong>
                  <Badge tone="warning">Excluido</Badge>
                </div>
                <p className="ds-field-hint">{item.reason}</p>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
});
ExpensePreviewCard.displayName = "ExpensePreviewCard";

export interface ExpenseListProps {
  expenses: ExpenseListItemViewModel[];
}

export const ExpenseList = memo(function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <EmptyState artworkSlot="expensesEmpty" title="Sin gastos" description="Aún no hay movimientos registrados para este mes." />;
  }

  return (
    <div className="ds-preview-list">
      {expenses.map((expense) => (
        <Card key={expense.expenseId} padding="md">
          <div className="ds-row-between">
            <div>
              <strong>{expense.categoryName}</strong>
              <p className="ds-field-hint">
                {expense.payerName} · {expense.date}
              </p>
            </div>
            <Badge tone={expense.statusTone}>{expense.statusLabel}</Badge>
          </div>
          {expense.note ? <p className="ds-field-hint">{expense.note}</p> : null}
          <div className="ds-row-between">
            <strong>{expense.totalAmountLabel}</strong>
            {expense.currentShareLabel ? <span className="ds-field-hint">{expense.currentShareLabel}</span> : null}
          </div>
        </Card>
      ))}
    </div>
  );
});
ExpenseList.displayName = "ExpenseList";

export interface MonthlySettlementPanelProps {
  settlement: MonthlySettlementViewModel | null;
}

export const MonthlySettlementPanel = memo(function MonthlySettlementPanel({
  settlement,
}: MonthlySettlementPanelProps) {
  if (!settlement) {
    return <EmptyState artworkSlot="expensesEmpty" title="Sin liquidación" description="Selecciona un mes para ver la liquidación mensual." />;
  }

  return (
    <Card padding="lg">
      <div className="ds-section-stack">
        <div className="ds-section-header">
          <strong>Liquidación mensual</strong>
          <Badge tone="neutral">{settlement.month}</Badge>
        </div>
        <div className="ds-summary-grid">
          <SummaryMetric label="Total" value={settlement.totalAmountLabel} />
          <SummaryMetric label="Diario" value={settlement.dailyAmountLabel} />
          <SummaryMetric label="Presencia" value={String(settlement.totalPresenceDays)} />
        </div>
        <div className="ds-preview-list">
          {settlement.rows.map((row) => (
            <Card key={row.membershipId} padding="sm">
              <div className="ds-row-between">
                <strong>{row.displayName}</strong>
                <Badge tone="success">{row.assignedAmountLabel}</Badge>
              </div>
              <p className="ds-field-hint">
                {row.presenceLabel} · {row.absenceLabel}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
});
MonthlySettlementPanel.displayName = "MonthlySettlementPanel";

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="sm">
      <p className="ds-field-hint">{label}</p>
      <strong>{value}</strong>
    </Card>
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export interface ExpenseWorkspaceProps {
  viewModel: ExpenseWorkspaceViewModel;
  categoryId: string;
  totalAmount: string;
  draftDate: string;
  loading?: boolean;
  onCategoryChange: (categoryId: string) => void;
  onTotalAmountChange: (value: string) => void;
  onDraftDateChange: (value: string) => void;
  onGeneratePreview: () => void;
  onConfirm: () => void;
}

export const ExpenseWorkspace = memo(function ExpenseWorkspace({
  viewModel,
  categoryId,
  totalAmount,
  draftDate,
  loading = false,
  onCategoryChange,
  onTotalAmountChange,
  onDraftDateChange,
  onGeneratePreview,
  onConfirm,
}: ExpenseWorkspaceProps) {
  return (
    <section className="ds-expenses-workspace" aria-label="Gastos">
      <ExpenseComposer
        categoryId={categoryId}
        totalAmount={totalAmount}
        draftDate={draftDate}
        loading={loading}
        viewModel={viewModel}
        onCategoryChange={onCategoryChange}
        onTotalAmountChange={onTotalAmountChange}
        onDraftDateChange={onDraftDateChange}
        onGeneratePreview={onGeneratePreview}
        onConfirm={onConfirm}
      />

      <div className="ds-grid-2">
        <MonthlySettlementPanel settlement={viewModel.settlement} />
        <Card padding="lg">
          <div className="ds-section-stack">
            <div className="ds-section-header">
              <strong>Estados y pagos</strong>
              <Badge tone="neutral">{viewModel.expenses.length}</Badge>
            </div>
            <ExpenseList expenses={viewModel.expenses} />
          </div>
        </Card>
      </div>
    </section>
  );
});
ExpenseWorkspace.displayName = "ExpenseWorkspace";

export { Modal };
