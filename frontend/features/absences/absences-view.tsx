"use client";

import { Calendar, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { Absence, AbsenceDraft, Member, MonthlySettlement } from "@/lib/domain";
import { addDays, dateInputValue, formatShortDate, monthLabel } from "@/lib/date";
import { displayMemberName, formatCurrency } from "@/lib/format";

type AbsencesViewProps = {
  members: Member[];
  absences: Absence[];
  settlement: MonthlySettlement | null;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  currentMembershipId: string;
  canManageHouse: boolean;
  loading: boolean;
  onCreateAbsence: (draft: AbsenceDraft) => Promise<boolean>;
  onCancelAbsence: (absenceId: string) => Promise<boolean>;
  memberName: (id: string) => string;
};

type DateRange = {
  start: string;
  end: string;
};

export function AbsencesView({
  members,
  absences,
  settlement,
  selectedMonth,
  onMonthChange,
  currentMembershipId,
  canManageHouse,
  loading,
  onCreateAbsence,
  onCancelAbsence,
  memberName,
}: AbsencesViewProps) {
  const monthAbsences = useMemo(
    () =>
      absences.slice().sort((a, b) => {
        const byStart = a.periodStart.localeCompare(b.periodStart);
        if (byStart !== 0) return byStart;
        return a.absenceId.localeCompare(b.absenceId);
      }),
    [absences],
  );

  return (
    <section data-tutorial="absences">
      <div className="page-heading">
        <p className="eyebrow">Salidas temporales</p>
        <h2>Ausencias y liquidación</h2>
      </div>

      <section className="content-section settlement-card">
        <div className="section-header">
          <h3>{monthLabel(selectedMonth)}</h3>
          <label className="month-picker">
            Mes
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => onMonthChange(event.target.value)}
            />
          </label>
        </div>
        {settlement ? (
          <>
            <div className="settlement-summary">
              <div>
                <span>Total del mes</span>
                <strong>{formatCurrency(settlement.totalAmount)}</strong>
              </div>
              <div>
                <span>Días de presencia</span>
                <strong>{settlement.totalPresenceDays}</strong>
              </div>
              <div>
                <span>Valor diario</span>
                <strong>{formatCurrency(settlement.dailyAmount)}</strong>
              </div>
            </div>
            <div className="settlement-list">
              {settlement.members.map((member) => (
                <article className="settlement-row" key={member.membershipId}>
                  <div>
                    <h4>{memberName(member.membershipId)}</h4>
                    <p>
                      {member.presenceDays} días efectivos · {member.absenceDays} días ausente
                    </p>
                  </div>
                  <strong>{formatCurrency(member.assignedAmount)}</strong>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="empty-state">No hay liquidación para este mes.</p>
        )}
      </section>

      {currentMembershipId && (
        <section className="content-section">
          <div className="section-header">
            <h3>Registrar ausencia</h3>
          </div>
          <AbsenceForm
            members={members}
            currentMembershipId={currentMembershipId}
            canManageHouse={canManageHouse}
            loading={loading}
            onSubmit={onCreateAbsence}
          />
        </section>
      )}

      <section className="content-section">
        <div className="section-header">
          <h3>Ausencias del mes</h3>
          <span>{monthAbsences.length}</span>
        </div>
        {monthAbsences.length === 0 ? (
          <p className="empty-state">No hay ausencias registradas para este período.</p>
        ) : (
          <div className="absence-list">
            {monthAbsences.map((absence) => (
              <article className={`absence-row ${absence.status.toLowerCase()}`} key={absence.absenceId}>
                <span className="row-icon">
                  <Calendar size={18} />
                </span>
                <div>
                  <h4>{memberName(absence.membershipId)}</h4>
                  <p>
                    {formatShortDate(absence.periodStart)} - {formatShortDate(absence.periodEnd)}
                  </p>
                  {absence.reason && <small>{absence.reason}</small>}
                </div>
                {absence.status === "ACTIVE" && (canManageHouse || absence.membershipId === currentMembershipId) ? (
                  <button
                    className="icon-action quiet-icon"
                    type="button"
                    aria-label="Cancelar ausencia"
                    title="Cancelar ausencia"
                    disabled={loading}
                    onClick={() => void onCancelAbsence(absence.absenceId)}
                  >
                    <X size={17} />
                  </button>
                ) : (
                  <span className="status pending">{absence.status === "ACTIVE" ? "Activa" : "Cancelada"}</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function AbsenceForm({
  members,
  currentMembershipId,
  canManageHouse,
  loading,
  onSubmit,
}: {
  members: Member[];
  currentMembershipId: string;
  canManageHouse: boolean;
  loading: boolean;
  onSubmit: (draft: AbsenceDraft) => Promise<boolean>;
}) {
  const [memberId, setMemberId] = useState(currentMembershipId || members[0]?.membershipId || "");
  const [reason, setReason] = useState("");
  const [range, setRange] = useState<DateRange>({
    start: dateInputValue(),
    end: addDays(dateInputValue(), 6),
  });
  const selectableMembers = canManageHouse
    ? members
    : members.filter((member) => member.membershipId === currentMembershipId);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!memberId || !range.start || !range.end) return;
    const saved = await onSubmit({
      membershipId: memberId,
      periodStart: range.start,
      periodEnd: addDays(range.end, 1),
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    });
    if (saved) setReason("");
  };

  return (
    <form className="absence-form" onSubmit={save}>
      <label>
        Integrante
        <select
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
          disabled={!canManageHouse}
        >
          {selectableMembers.map((member) => (
            <option value={member.membershipId} key={member.membershipId}>
              {displayMemberName(member)}
              {member.membershipId === currentMembershipId ? " (Tú)" : ""}
            </option>
          ))}
        </select>
      </label>

      <RangeCalendar value={range} onChange={setRange} />

      <label>
        Motivo <span className="optional-label">Opcional</span>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={120}
          placeholder="Ej. viaje"
        />
      </label>

      <div className="form-actions">
        <div className="absence-range-preview">
          <strong>
            {formatShortDate(range.start)} - {formatShortDate(range.end)}
          </strong>
          <span>El rango usa un solo calendario.</span>
        </div>
        <button className="soft-action" disabled={loading || !memberId}>
          <Plus size={18} /> Guardar ausencia
        </button>
      </div>
    </form>
  );
}

function RangeCalendar({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
}) {
  const [cursorMonth, setCursorMonth] = useState(value.start.slice(0, 7));
  const [pickingEnd, setPickingEnd] = useState(false);

  const month = useMemo(() => monthState(cursorMonth), [cursorMonth]);
  const selectedStart = value.start;
  const selectedEnd = value.end;

  const clickDay = (day: string) => {
    if (!pickingEnd) {
      onChange({ start: day, end: day });
      setPickingEnd(true);
      return;
    }
    if (day < selectedStart) {
      onChange({ start: day, end: selectedStart });
    } else {
      onChange({ start: selectedStart, end: day });
    }
    setPickingEnd(false);
  };

  return (
    <div className="range-calendar">
      <div className="range-calendar-header">
        <button type="button" className="icon-action quiet-icon" onClick={() => setCursorMonth(previousMonth(cursorMonth))}>
          <ChevronLeft size={17} />
        </button>
        <strong>{monthLabel(cursorMonth)}</strong>
        <button type="button" className="icon-action quiet-icon" onClick={() => setCursorMonth(nextMonth(cursorMonth))}>
          <ChevronRight size={17} />
        </button>
      </div>
      <div className="range-calendar-grid weekdays">
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="range-calendar-grid days">
        {month.cells.map((cell, index) =>
          cell ? (
            <button
              key={cell}
              type="button"
              className={dayClassName(cell, selectedStart, selectedEnd)}
              onClick={() => clickDay(cell)}
            >
              {Number(cell.slice(8, 10))}
            </button>
          ) : (
            <span key={`placeholder-${index}`} className="day-placeholder" />
          ),
        )}
      </div>
    </div>
  );
}

function dayClassName(day: string, start: string, end: string) {
  const inRange = day >= start && day <= end;
  const isStart = day === start;
  const isEnd = day === end;
  return [
    "calendar-day",
    inRange ? "in-range" : "",
    isStart ? "range-start" : "",
    isEnd ? "range-end" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function monthState(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leading = (firstDay.getUTCDay() + 6) % 7;
  const cells: Array<string | null> = [...Array(leading).fill(null)];
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  return { cells };
}

function previousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return date.toISOString().slice(0, 7);
}

function nextMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber, 1));
  return date.toISOString().slice(0, 7);
}
