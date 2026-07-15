"use client";

import { ArrowUpRight, CalendarOff, House, Plus, ReceiptText, Scale, Sparkles } from "lucide-react";
import { Badge, Button, Card, EmptyState } from "@/design-system";
import type { HomeQuickActionId, HomeViewModel } from "./application";

export interface HomeViewProps {
  viewModel: HomeViewModel;
  onOpenExpense: () => void;
  onGoToExpenses: () => void;
  onGoToAbsences: () => void;
  onGoToHouse: () => void;
  onGoToRules: () => void;
  onGoToTasks: () => void;
}

export function HomeView({
  viewModel,
  onOpenExpense,
  onGoToExpenses,
  onGoToAbsences,
  onGoToHouse,
  onGoToRules,
  onGoToTasks,
}: HomeViewProps) {
  const actionMap: Record<HomeQuickActionId, () => void> = {
    expenses: onOpenExpense,
    absences: onGoToAbsences,
    rules: onGoToRules,
    house: onGoToHouse,
    tasks: onGoToTasks,
  };

  if (viewModel.emptyState) {
    return (
      <EmptyState
        title="Aún no hay actividad"
        description="Cuando existan gastos, ausencias o tareas, este tablero mostrará la convivencia mensual."
        action={
          <Button type="button" leadingIcon={<Plus size={16} />} onClick={onOpenExpense}>
            Registrar gasto
          </Button>
        }
      />
    );
  }

  return (
    <section className="home-dashboard" data-tutorial="home">
      <div className="page-heading">
        <p className="eyebrow">Panel central</p>
        <h2>{viewModel.heroTitle}</h2>
      </div>

      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-hero-badge">Convivencia activa</span>
          <h3>{viewModel.heroDescription}</h3>
          <p>La información se entrega ya calculada por las consultas del sistema.</p>
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
          <Sparkles size={34} />
        </div>
      </section>

      <div className="home-grid">
        {viewModel.summaryMetrics.map((metric, index) => (
          <Card key={`${metric.label}-${index}`} padding="md" elevated={index === 0}>
            <div className="home-card-head">
              <span>{metric.label}</span>
              {index === 0 ? <Scale size={18} aria-hidden="true" /> : null}
            </div>
            <strong>{metric.value}</strong>
            {metric.helperText ? <p>{metric.helperText}</p> : null}
          </Card>
        ))}
      </div>

      <div className="metric-grid">
        {viewModel.presence.map((metric, index) => (
          <Card key={`${metric.label}-${index}`} padding="md">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-2)" }}>
              {index === 0 ? <House size={20} aria-hidden="true" /> : <ReceiptText size={20} aria-hidden="true" />}
              <span>{metric.label}</span>
            </div>
            <strong>{metric.value}</strong>
            {metric.helperText ? <p className="ds-field-hint">{metric.helperText}</p> : null}
          </Card>
        ))}
      </div>

      <div className="section-header">
        <h3>Accesos rápidos</h3>
      </div>
      <div className="home-quick-actions">
        {viewModel.quickActions.map((action) => (
          <button key={action.id} type="button" className="home-quick-action" onClick={actionMap[action.id]}>
            <div>
              <strong>{action.label}</strong>
              <p className="ds-field-hint">{action.description}</p>
            </div>
            <Badge tone={action.tone === "primary" ? "success" : "neutral"}>
              <ArrowUpRight size={14} />
            </Badge>
          </button>
        ))}
      </div>

      <div className="home-lane-grid">
        <Card padding="lg">
          <div className="section-header">
            <h3>Gastos</h3>
            <Button type="button" variant="ghost" onClick={onGoToExpenses}>
              Ver todos
            </Button>
          </div>
          <div className="home-rail">
            {viewModel.expenses.length > 0 ? (
              viewModel.expenses.map((expense) => (
                <article key={expense.expenseId} className="home-rail-item">
                  <div>
                    <strong>{expense.title}</strong>
                    <p className="ds-field-hint">{expense.subtitle}</p>
                  </div>
                  <div style={{ display: "grid", justifyItems: "end" }}>
                    <Badge tone={expense.statusTone}>{expense.statusLabel}</Badge>
                    <strong>{expense.amountLabel}</strong>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Sin gastos recientes" description="Registra el primer movimiento del mes." />
            )}
          </div>
        </Card>

        <Card padding="lg">
          <div className="section-header">
            <h3>Presencia</h3>
            <Button type="button" variant="ghost" onClick={onGoToAbsences}>
              Abrir
            </Button>
          </div>
          <div className="home-rail">
            {viewModel.upcomingAbsences.length > 0 ? (
              viewModel.upcomingAbsences.map((absence) => (
                <article key={absence.absenceId} className="home-rail-item">
                  <div>
                    <strong>{absence.title}</strong>
                    <p className="ds-field-hint">{absence.subtitle}</p>
                  </div>
                  <Badge tone={absence.statusTone}>{absence.statusLabel}</Badge>
                </article>
              ))
            ) : (
              <EmptyState title="Sin próximas ausencias" description="La casa no tiene ausencias activas cercanas." />
            )}
          </div>
        </Card>
      </div>

      <div className="home-lane-grid">
        <Card padding="lg">
          <div className="section-header">
            <h3>Tareas disponibles</h3>
            <Button type="button" variant="ghost" onClick={onGoToTasks}>
              Ver semana
            </Button>
          </div>
          <div className="home-rail">
            {viewModel.availableTasks.length > 0 ? (
              viewModel.availableTasks.map((task) => (
                <article key={task.taskId} className="home-rail-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p className="ds-field-hint">{task.subtitle}</p>
                  </div>
                  <Badge tone={task.statusTone}>{task.statusLabel}</Badge>
                </article>
              ))
            ) : (
              <EmptyState title="Sin tareas disponibles" description="Todavía no hay asignaciones semanales activas." />
            )}
          </div>
        </Card>

        <Card padding="lg">
          <div className="section-header">
            <h3>Movimientos recientes</h3>
            <Button type="button" variant="ghost" onClick={onGoToExpenses}>
              Ver historial
            </Button>
          </div>
          <div className="home-rail">
            {viewModel.recentMovements.length > 0 ? (
              viewModel.recentMovements.map((movement) => (
                <article key={movement.movementId} className="home-rail-item">
                  <div>
                    <strong>{movement.title}</strong>
                    <p className="ds-field-hint">{movement.subtitle}</p>
                  </div>
                  {movement.valueLabel ? <strong>{movement.valueLabel}</strong> : <Badge tone="neutral">Info</Badge>}
                </article>
              ))
            ) : (
              <EmptyState title="Sin movimientos recientes" description="Este mes todavía no hay actividad." />
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
