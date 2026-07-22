"use client";

import { AlertTriangle, CalendarOff, Check, Clock3, RefreshCw, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  DateField,
  EmptyState,
  ErrorState,
  Modal,
  Select,
  Skeleton,
  SummaryCard,
  Toast,
  TextField,
} from "@/design-system";
import type {
  Absence as AppAbsence,
  AbsenceDraft as AppAbsenceDraft,
  ChoreWeek as AppChoreWeek,
  Member as AppMember,
  MonthlySettlement as AppMonthlySettlement,
} from "@/lib/domain";
import { addDays as addDaysIso, formatShortDate, monthLabel } from "@/lib/date";
import { displayMemberName, formatCurrency } from "@/lib/format";
import {
  calculateAbsenceImpact,
  createAbsencePermissionPolicy,
  findAbsenceConflicts,
  type AbsenceActor,
  type AbsenceConflict,
  type AbsenceDraft,
  type AbsenceImpactSummary,
  type AbsenceMember,
  type AbsencePermissionSnapshot,
  type AbsenceRecord,
  type MonthlySettlementSummary,
  type TaskWeek,
} from "../domain";

export interface AbsencesPageProps {
  members: AppMember[];
  absences: AppAbsence[];
  settlement: AppMonthlySettlement | null;
  week?: AppChoreWeek | null;
  selectedMonth: string;
  currentMembershipId: string;
  currentRole?: "ADMIN" | "MEMBER";
  canManageHouse: boolean;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onMonthChange: (month: string) => void;
  onCreateAbsence: (draft: AppAbsenceDraft) => Promise<boolean>;
  onCancelAbsence: (absenceId: string) => Promise<boolean>;
  memberName: (id: string) => string;
}

export function AbsencesPage(props: AbsencesPageProps) {
  const { members: appMembers, memberName } = props;
  const actor: AbsenceActor = {
    membershipId: props.currentMembershipId,
    role: props.currentRole ?? (props.canManageHouse ? "ADMIN" : "MEMBER"),
  };
  const permissions = createAbsencePermissionPolicy(actor);

  const members = useMemo(
    () =>
      appMembers.map<AbsenceMember>((member) => ({
        membershipId: member.membershipId,
        householdId: member.householdId,
        displayName: memberName(member.membershipId) ?? displayMemberName(member),
        role: member.role,
        livingSince: member.livingSince,
        status: "ACTIVE",
      })),
    [appMembers, memberName],
  );

  const absences = useMemo(
    () =>
      props.absences.map<AbsenceRecord>((absence) => ({
        absenceId: absence.absenceId,
        householdId: "",
        membershipId: absence.membershipId,
        status: absence.status,
        periodStart: absence.periodStart,
        periodEnd: absence.periodEnd,
        reason: absence.reason,
        audit: absence.audit,
      })),
    [props.absences],
  );

  const settlement = useMemo<MonthlySettlementSummary | null>(
    () =>
      props.settlement
        ? {
            householdId: props.settlement.householdId,
            month: props.settlement.month,
            totalAmount: props.settlement.totalAmount,
            daysInMonth: props.settlement.daysInMonth,
            totalMemberDays: props.settlement.totalMemberDays,
            totalAbsenceDays: props.settlement.totalAbsenceDays,
            totalPresenceDays: props.settlement.totalPresenceDays,
            dailyAmount: props.settlement.dailyAmount,
            members: props.settlement.members.map((member) => ({ ...member })),
          }
        : null,
    [props.settlement],
  );

  const taskWeek = useMemo<TaskWeek | null>(
    () =>
      props.week
        ? {
            weekId: props.week.choreWeekId,
            householdId: "",
            weekStart: props.week.weekStart,
            weekEnd: props.week.weekEnd,
            tasks: props.week.tasks.map((task) => ({
              taskId: task.choreTaskId,
              commonAreaId: task.commonAreaId,
              name: task.name,
              priority: task.priority,
              assigneeLimit: task.assigneeLimit,
              weeklyStatus: task.weeklyStatus,
              assignments: task.assignments.map((assignment) => ({ ...assignment })),
            })),
          }
        : null,
    [props.week],
  );

  const [feedback, setFeedback] = useState<
    | { tone: "success" | "danger"; title: string; description?: string }
    | null
  >(null);
  const [confirmCancelAbsence, setConfirmCancelAbsence] = useState<AbsenceRecord | null>(null);

  const memberForDraft =
    members.find((member) => member.membershipId === props.currentMembershipId) ?? members[0];
  const empty = props.absences.length === 0;

  const impactDraft = useMemo<AbsenceDraft | null>(() => {
    if (!memberForDraft) return null;
    const today = new Date().toISOString().slice(0, 10);
    return {
      membershipId: memberForDraft.membershipId,
      periodStart: today,
      periodEnd: today,
      createdByMembershipId: props.currentMembershipId,
    };
  }, [memberForDraft, props.currentMembershipId]);

  const impact = useMemo<AbsenceImpactSummary | null>(() => {
    if (!impactDraft) return null;
    return calculateAbsenceImpact({
      members,
      settlement,
      week: taskWeek,
      draft: impactDraft,
    });
  }, [impactDraft, members, settlement, taskWeek]);

  if (props.loading) {
    return (
      <section className="ds-absences-page" aria-busy="true">
        <AbsencesLoadingState />
      </section>
    );
  }

  if (props.error) {
    return (
      <section className="ds-absences-page">
        <ErrorState
          title="No pudimos cargar las ausencias"
          description={props.error}
          action={
            props.onRetry ? (
              <Button leadingIcon={<RefreshCw size={16} />} onClick={props.onRetry}>
                Reintentar
              </Button>
            ) : undefined
          }
        />
      </section>
    );
  }

  return (
    <section className="ds-absences-page" aria-label="Ausencias">
      {feedback ? (
        <Toast
          tone={feedback.tone}
          title={feedback.title}
          description={feedback.description}
          style={{ marginBottom: "var(--ds-space-4)" }}
        />
      ) : null}

      <div className="ds-absences-page__hero">
        <div>
          <p className="eyebrow">Presencia y convivencia</p>
          <h2>Ausencias</h2>
          <p className="ds-field-hint">
            Gestiona ausencias, revisa el impacto en presencia, liquidación y tareas antes de guardar.
          </p>
        </div>
        <div className="ds-absences-page__hero-actions">
          <Badge tone={permissions.canCreateForOthers ? "success" : "neutral"}>
            {permissions.canCreateForOthers ? "Admin con gestión extendida" : "Autogestión"}
          </Badge>
          <span className="ds-field-hint">{monthLabel(props.selectedMonth)}</span>
        </div>
      </div>

      <div className="ds-absences-page__grid">
        <div className="ds-absences-page__main">
          <Card>
            <div className="ds-absences-page__section-header">
              <div>
                <strong>Registrar ausencia</strong>
                <div className="ds-field-hint">El formulario confirma antes de guardar.</div>
              </div>
              <Button
                variant="secondary"
                leadingIcon={<CalendarOff size={16} />}
                onClick={() => props.onMonthChange(props.selectedMonth)}
              >
                Mes actual
              </Button>
            </div>

            <AbsenceForm
              members={members}
              actor={actor}
              permissions={permissions}
              settlement={settlement}
              week={taskWeek}
              absences={absences}
              currentMembershipId={props.currentMembershipId}
              loading={props.loading}
              onSubmit={async (draft) => {
                const saved = await props.onCreateAbsence({
                  ...draft,
                  periodEnd: addDaysIso(draft.periodEnd, 1),
                });
                if (saved) {
                  setFeedback({
                    tone: "success",
                    title: "Ausencia guardada",
                    description: "Se actualizó el impacto en presencia, liquidación y tareas.",
                  });
                } else {
                  setFeedback({
                    tone: "danger",
                    title: "No se pudo guardar",
                    description: "Revisa permisos, fechas o conflictos antes de reintentar.",
                  });
                }
                return saved;
              }}
            />
          </Card>

          <PresenceImpactSummary
            loading={props.loading}
            settlement={settlement}
            impact={impact}
          />

          <Card>
            <div className="ds-absences-page__section-header">
              <div>
                <strong>Ausencias del período</strong>
                <div className="ds-field-hint">{props.absences.length} registros</div>
              </div>
            </div>
            <AbsenceList
              absences={absences}
              currentMembershipId={props.currentMembershipId}
              canCancelOthers={permissions.canCancelOthers}
              loading={props.loading}
              memberName={props.memberName}
              onCancel={(absence) => setConfirmCancelAbsence(absence)}
            />
          </Card>
        </div>

        <div className="ds-absences-page__aside">
          <Card>
            <div className="ds-absences-page__section-header">
              <div>
                <strong>Impacto actual</strong>
                <div className="ds-field-hint">Se actualiza con el mes seleccionado.</div>
              </div>
            </div>
            {impact ? (
              <div className="ds-absences-page__impact-stack">
                <SummaryCard
                  title="Presencia total"
                  value={`${impact.totalPresenceDaysAfter}`}
                  helperText={`Antes ${impact.totalPresenceDaysBefore}`}
                  icon={<Clock3 size={18} />}
                />
                <SummaryCard
                  title="Monto proyectado"
                  value={formatCurrency(impact.totalAssignedAmountAfter)}
                  helperText={`Antes ${formatCurrency(impact.totalAssignedAmountBefore)}`}
                  icon={<Check size={18} />}
                />
                <SummaryCard
                  title="Tareas afectadas"
                  value={`${impact.affectedTasks}`}
                  helperText="Solo tareas pendientes de la semana actual"
                  icon={<AlertTriangle size={18} />}
                />
              </div>
            ) : (
              <EmptyState
                artworkSlot="absencesEmpty"
                title="Sin impacto calculable"
                description="Selecciona una membresía con presencia y una liquidación cargada para ver el impacto."
              />
            )}
          </Card>

          {empty ? (
            <EmptyState
              artworkSlot="absencesEmpty"
              title="Aún no hay ausencias"
              description="Cuando registres la primera, aparecerá aquí junto con su estado y acciones."
            />
          ) : null}
        </div>
      </div>

      <ConfirmationDialog
        open={Boolean(confirmCancelAbsence)}
        title="Cancelar ausencia"
        description={
          confirmCancelAbsence
            ? `${props.memberName(confirmCancelAbsence.membershipId)} · ${formatShortDate(confirmCancelAbsence.periodStart)} a ${formatShortDate(confirmCancelAbsence.periodEnd)}`
            : undefined
        }
        confirmLabel="Cancelar"
        confirmTone="danger"
        onClose={() => setConfirmCancelAbsence(null)}
        onConfirm={async () => {
          if (!confirmCancelAbsence) return;
          const cancelled = await props.onCancelAbsence(confirmCancelAbsence.absenceId);
          setConfirmCancelAbsence(null);
          setFeedback(
            cancelled
              ? {
                  tone: "success",
                  title: "Ausencia cancelada",
                  description: "El calendario, la liquidación y las tareas se recalcularon.",
                }
              : {
                  tone: "danger",
                  title: "No se pudo cancelar",
                  description: "Intenta de nuevo o revisa los permisos.",
                },
          );
        }}
      />
    </section>
  );
}

export interface AbsenceFormProps {
  members: AbsenceMember[];
  actor: AbsenceActor;
  permissions: AbsencePermissionSnapshot;
  settlement: MonthlySettlementSummary | null;
  week: TaskWeek | null;
  absences: AbsenceRecord[];
  currentMembershipId: string;
  loading: boolean;
  onSubmit: (draft: AbsenceDraft) => Promise<boolean>;
}

export function AbsenceForm({
  members,
  actor,
  permissions,
  settlement,
  week,
  absences,
  currentMembershipId,
  loading,
  onSubmit,
}: AbsenceFormProps) {
  const defaultMemberId = members.find((member) => member.membershipId === currentMembershipId)?.membershipId ?? members[0]?.membershipId ?? "";
  const [membershipId, setMembershipId] = useState(defaultMemberId);
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [submittedDraft, setSubmittedDraft] = useState<AbsenceDraft | null>(null);

  const draft: AbsenceDraft = useMemo(
    () => ({
      membershipId,
      periodStart,
      periodEnd,
      reason: reason.trim() || undefined,
      createdByMembershipId: actor.membershipId,
    }),
    [actor.membershipId, membershipId, periodEnd, periodStart, reason],
  );

  const conflicts = useMemo(() => findAbsenceConflicts(draft, absences), [absences, draft]);
  const impact = useMemo(
    () =>
      calculateAbsenceImpact({
        members,
        settlement,
        week,
        draft,
      }),
    [draft, members, settlement, week],
  );

  const canSubmit =
    !loading &&
    membershipId.length > 0 &&
    periodStart.length > 0 &&
    periodEnd.length > 0 &&
    conflicts.length === 0 &&
    (membershipId === currentMembershipId ? permissions.canCreateForSelf : permissions.canCreateForOthers);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmittedDraft(draft);
  };

  const openConfirmation = () => {
    if (!canSubmit) return;
    setSubmittedDraft(draft);
  };

  return (
    <>
      <form className="ds-absences-form" onSubmit={submit}>
        <Select
          label="Integrante"
          value={membershipId}
          disabled={!permissions.canSelectOthers && membershipId !== currentMembershipId}
          onChange={(event) => setMembershipId(event.target.value)}
          options={members.map((member) => ({
            value: member.membershipId,
            label: `${member.displayName}${member.membershipId === currentMembershipId ? " (Tú)" : ""}`,
            disabled: !permissions.canSelectOthers && member.membershipId !== currentMembershipId,
          }))}
        />

        <div className="ds-absences-form__dates">
          <DateField label="Inicio" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
          <DateField label="Fin" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
        </div>

        <DateRangePreview start={periodStart} end={periodEnd} />

        <TextField
          label="Motivo"
          placeholder="Opcional"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <ConflictMessage conflicts={conflicts} memberName={(id) => members.find((member) => member.membershipId === id)?.displayName ?? id} />

        <PresenceImpactSummary
          loading={loading}
          settlement={settlement}
          impact={impact}
        />

        <div className="ds-absences-form__actions">
          <Badge tone={canSubmit ? "success" : "warning"}>{canSubmit ? "Listo para guardar" : "Revisa los campos"}</Badge>
          <Button
            type="button"
            loading={loading}
            disabled={!canSubmit}
            leadingIcon={<CalendarOff size={16} />}
            onClick={openConfirmation}
          >
            Guardar ausencia
          </Button>
        </div>
      </form>

      <ConfirmationDialog
        open={Boolean(submittedDraft)}
        title="Confirmar ausencia"
        description={
          submittedDraft
            ? `${members.find((member) => member.membershipId === submittedDraft.membershipId)?.displayName ?? submittedDraft.membershipId} · ${formatShortDate(submittedDraft.periodStart)} a ${formatShortDate(submittedDraft.periodEnd)}`
            : undefined
        }
        confirmLabel="Guardar"
        onClose={() => setSubmittedDraft(null)}
        onConfirm={async () => {
          if (!submittedDraft) return;
          const saved = await onSubmit(submittedDraft);
          if (saved) {
            setReason("");
          }
          setSubmittedDraft(null);
        }}
      />
    </>
  );
}

export interface AbsenceListProps {
  absences: AbsenceRecord[];
  currentMembershipId: string;
  canCancelOthers: boolean;
  loading: boolean;
  memberName: (id: string) => string;
  onCancel: (absence: AbsenceRecord) => void;
}

export function AbsenceList({
  absences,
  currentMembershipId,
  canCancelOthers,
  loading,
  memberName,
  onCancel,
}: AbsenceListProps) {
  if (loading) {
    return (
      <div className="ds-absences-list ds-absences-list--loading" aria-busy="true">
        <Skeleton height={96} />
        <Skeleton height={96} />
        <Skeleton height={96} />
      </div>
    );
  }

  if (absences.length === 0) {
    return (
      <EmptyState
        artworkSlot="absencesEmpty"
        title="Sin ausencias registradas"
        description="La primera ausencia aparecerá aquí con su historial y acciones."
      />
    );
  }

  return (
    <div className="ds-absences-list">
      {absences.map((absence) => (
        <AbsenceCard
          key={absence.absenceId}
          absence={absence}
          memberName={memberName}
          canCancel={canCancelOthers || absence.membershipId === currentMembershipId}
          onCancel={() => onCancel(absence)}
        />
      ))}
    </div>
  );
}

export interface AbsenceCardProps {
  absence: AbsenceRecord;
  memberName: (id: string) => string;
  canCancel: boolean;
  onCancel: () => void;
}

export function AbsenceCard({ absence, memberName, canCancel, onCancel }: AbsenceCardProps) {
  return (
    <Card className="ds-absence-card">
      <div className="ds-absence-card__header">
        <Avatar name={memberName(absence.membershipId)} size={44} />
        <div style={{ display: "grid", gap: "var(--ds-space-1)" }}>
          <strong>{memberName(absence.membershipId)}</strong>
          <span className="ds-field-hint">
            {formatShortDate(absence.periodStart)} — {formatShortDate(absence.periodEnd)}
          </span>
        </div>
        <Badge tone={absence.status === "ACTIVE" ? "warning" : "neutral"}>
          {absence.status === "ACTIVE" ? "Activa" : "Cancelada"}
        </Badge>
      </div>
      {absence.reason ? <p className="ds-field-hint">{absence.reason}</p> : null}
      {canCancel ? (
        <div className="ds-absence-card__actions">
          <Button variant="secondary" leadingIcon={<X size={16} />} onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export interface PresenceImpactSummaryProps {
  loading: boolean;
  settlement: MonthlySettlementSummary | null;
  impact: AbsenceImpactSummary | null;
}

export function PresenceImpactSummary({ loading, settlement, impact }: PresenceImpactSummaryProps) {
  if (loading) {
    return (
      <Card>
        <div className="ds-absences-page__section-header">
          <div>
            <strong>Impacto de presencia</strong>
            <div className="ds-field-hint">Cargando cálculo…</div>
          </div>
        </div>
        <div className="ds-absences-page__impact-stack">
          <Skeleton height={96} />
          <Skeleton height={96} />
          <Skeleton height={96} />
        </div>
      </Card>
    );
  }

  if (!settlement || !impact) {
    return (
      <Card>
        <EmptyState
          artworkSlot="absencesEmpty"
          title="Sin datos suficientes"
          description="Carga miembros, ausencia y liquidación para ver el impacto potencial."
        />
      </Card>
    );
  }

  const row = impact.rows[0];
  return (
    <Card>
      <div className="ds-absences-page__section-header">
        <div>
          <strong>Impacto de presencia</strong>
          <div className="ds-field-hint">Comparación antes y después de la ausencia.</div>
        </div>
      </div>
      <div className="ds-absences-page__impact-stack">
        <SummaryCard
          title="Días de presencia"
          value={`${row.presenceDaysAfter}`}
          helperText={`Antes ${row.presenceDaysBefore} · +${row.absenceDaysAdded} días de ausencia`}
          icon={<Clock3 size={18} />}
        />
        <SummaryCard
          title="Liquidación estimada"
          value={formatCurrency(row.assignedAmountAfter)}
          helperText={`Antes ${formatCurrency(row.assignedAmountBefore)}`}
          icon={<Check size={18} />}
        />
        <SummaryCard
          title="Tareas afectadas"
          value={`${row.affectedTasks}`}
          helperText={`En la semana ${settlement.month}`}
          icon={<AlertTriangle size={18} />}
        />
      </div>
    </Card>
  );
}

export interface ConflictMessageProps {
  conflicts: AbsenceConflict[];
  memberName: (id: string) => string;
}

export function ConflictMessage({ conflicts, memberName }: ConflictMessageProps) {
  if (conflicts.length === 0) return null;
  return (
    <Card className="ds-conflict-message">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-2)" }}>
        <AlertTriangle size={18} />
        <strong>Conflicto de fechas</strong>
      </div>
      <div className="ds-field-hint">
        Esta ausencia se superpone con una ausencia activa y no puede guardarse.
      </div>
      <div style={{ display: "grid", gap: "var(--ds-space-2)" }}>
        {conflicts.map((conflict) => (
          <Badge key={conflict.absenceId} tone="danger">
            {memberName(conflict.membershipId)} · {formatShortDate(conflict.periodStart)} -{" "}
            {formatShortDate(conflict.periodEnd)} · {conflict.overlapDays} días
          </Badge>
        ))}
      </div>
    </Card>
  );
}

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  confirmTone?: "primary" | "danger";
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmTone = "primary",
  loading = false,
  onClose,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--ds-space-2)" }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={confirmTone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="ds-field-hint">
        Revisa el rango, el integrante y el impacto antes de confirmar la acción.
      </p>
    </Modal>
  );
}

function DateRangePreview({ start, end }: { start: string; end: string }) {
  return (
    <Card padding="sm" className="ds-date-range-preview">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-2)" }}>
        <Badge tone="neutral">Rango</Badge>
        <strong>
          {formatShortDate(start)} — {formatShortDate(end)}
        </strong>
      </div>
    </Card>
  );
}

function AbsencesLoadingState() {
  return (
    <div className="ds-absences-page__loading">
      <Card>
        <Skeleton height={28} width="40%" />
        <div style={{ display: "grid", gap: "var(--ds-space-3)", marginTop: "var(--ds-space-4)" }}>
          <Skeleton height={140} />
          <Skeleton height={120} />
          <Skeleton height={120} />
        </div>
      </Card>
    </div>
  );
}
