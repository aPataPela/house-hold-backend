export type AbsenceStatus = "ACTIVE" | "CANCELLED";
export type MemberRole = "ADMIN" | "MEMBER";

export interface AbsenceMember {
  membershipId: string;
  householdId: string;
  displayName: string;
  role: MemberRole;
  livingSince: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface AbsenceRecord {
  absenceId: string;
  householdId: string;
  membershipId: string;
  status: AbsenceStatus;
  periodStart: string;
  periodEnd: string;
  reason?: string;
  audit: {
    createdByMembershipId: string;
    createdAt: string;
    cancelledByMembershipId?: string;
    cancelledAt?: string;
  };
}

export interface AbsenceDraft {
  membershipId: string;
  periodStart: string;
  periodEnd: string;
  reason?: string;
  createdByMembershipId: string;
}

export interface MonthPeriod {
  month: string;
  from: string;
  to: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface MonthlySettlementRow {
  membershipId: string;
  memberDays: number;
  absenceDays: number;
  presenceDays: number;
  assignedAmount: number;
}

export interface MonthlySettlementSummary {
  householdId: string;
  month: string;
  totalAmount: number;
  daysInMonth: number;
  totalMemberDays: number;
  totalAbsenceDays: number;
  totalPresenceDays: number;
  dailyAmount: number;
  members: MonthlySettlementRow[];
}

export interface TaskAssignment {
  assignmentId: string;
  membershipId: string;
  status: "PENDING" | "DONE" | "NOT_DONE";
}

export interface TaskWeekTask {
  taskId: string;
  commonAreaId: string;
  name: string;
  priority: number;
  assigneeLimit: number;
  weeklyStatus: "PENDING" | "DONE" | "NOT_DONE";
  assignments: TaskAssignment[];
}

export interface TaskWeek {
  weekId: string;
  householdId: string;
  weekStart: string;
  weekEnd: string;
  tasks: TaskWeekTask[];
}

export interface AbsenceConflict {
  absenceId: string;
  membershipId: string;
  periodStart: string;
  periodEnd: string;
  reason?: string;
  overlapDays: number;
}

export interface AbsenceImpactRow {
  membershipId: string;
  displayName: string;
  presenceDaysBefore: number;
  presenceDaysAfter: number;
  absenceDaysAdded: number;
  assignedAmountBefore: number;
  assignedAmountAfter: number;
  affectedTasks: number;
}

export interface AbsenceImpactSummary {
  month: string;
  totalPresenceDaysBefore: number;
  totalPresenceDaysAfter: number;
  totalAssignedAmountBefore: number;
  totalAssignedAmountAfter: number;
  affectedTasks: number;
  rows: AbsenceImpactRow[];
}

export interface AbsencePermissionSnapshot {
  canCreateForSelf: boolean;
  canCreateForOthers: boolean;
  canCancelOwn: boolean;
  canCancelOthers: boolean;
  canSelectOthers: boolean;
}

export interface AbsenceActor {
  membershipId: string;
  role: MemberRole;
}

export function normalizeDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10);
}

export function monthRange(month: string): MonthPeriod {
  const [year, monthNumber] = normalizeMonth(month).split("-").map(Number);
  const from = `${normalizeMonth(month)}-01`;
  const to = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
  return { month: normalizeMonth(month), from, to };
}

export function normalizeMonth(value: string | Date): string {
  if (value instanceof Date) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return value.slice(0, 7);
}

export function compareDates(a: string, b: string): number {
  return parseDate(a).getTime() - parseDate(b).getTime();
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetweenInclusive(from: string, to: string): number {
  const start = parseDate(from).getTime();
  const end = parseDate(to).getTime();
  return Math.floor((end - start) / 86400000) + 1;
}

export function overlapDays(a: DateRange, b: DateRange): number {
  const start = compareDates(a.start, b.start) > 0 ? a.start : b.start;
  const end = compareDates(a.end, b.end) < 0 ? a.end : b.end;
  return compareDates(start, end) <= 0 ? daysBetweenInclusive(start, end) : 0;
}

export function rangeOverlaps(a: DateRange, b: DateRange): boolean {
  return overlapDays(a, b) > 0;
}

function parseDate(value: string): Date {
  return new Date(`${normalizeDate(value)}T00:00:00.000Z`);
}

export function createAbsencePermissionPolicy(actor: AbsenceActor): AbsencePermissionSnapshot {
  const isAdmin = actor.role === "ADMIN";
  return {
    canCreateForSelf: true,
    canCreateForOthers: isAdmin,
    canCancelOwn: true,
    canCancelOthers: isAdmin,
    canSelectOthers: isAdmin,
  };
}

export function findAbsenceConflicts(
  draft: Pick<AbsenceDraft, "membershipId" | "periodStart" | "periodEnd">,
  absences: AbsenceRecord[],
): AbsenceConflict[] {
  const targetRange = { start: normalizeDate(draft.periodStart), end: normalizeDate(draft.periodEnd) };
  const conflicts: AbsenceConflict[] = [];
  for (const absence of absences) {
    if (absence.status !== "ACTIVE" || absence.membershipId !== draft.membershipId) {
      continue;
    }
    const overlap = overlapDays(
      targetRange,
      { start: normalizeDate(absence.periodStart), end: normalizeDate(absence.periodEnd) },
    );
    if (overlap > 0) {
      conflicts.push({
        absenceId: absence.absenceId,
        membershipId: absence.membershipId,
        periodStart: absence.periodStart,
        periodEnd: absence.periodEnd,
        reason: absence.reason,
        overlapDays: overlap,
      });
    }
  }
  return conflicts;
}

export function calculateProjectedSettlement(
  settlement: MonthlySettlementSummary | null,
  targetMembershipId: string,
  absenceDaysAdded: number,
): MonthlySettlementSummary | null {
  if (!settlement) return null;

  const rows = settlement.members.map((row) => {
    if (row.membershipId !== targetMembershipId) {
      return { ...row };
    }
    const presenceDaysAfter = Math.max(row.presenceDays - absenceDaysAdded, 0);
    return {
      ...row,
      absenceDays: row.absenceDays + absenceDaysAdded,
      presenceDays: presenceDaysAfter,
    };
  });

  const totalPresenceDaysAfter = rows.reduce((sum, row) => sum + row.presenceDays, 0);
  const totalAssignedAmountAfter = settlement.totalAmount;
  let assignedRemainder = totalAssignedAmountAfter;

  const adjustedRows = rows.map((row, index) => {
    const assignedAmount =
      index === rows.length - 1
        ? assignedRemainder
        : totalPresenceDaysAfter > 0
          ? Math.floor((settlement.totalAmount * row.presenceDays) / totalPresenceDaysAfter)
          : 0;
    assignedRemainder -= assignedAmount;
    return { ...row, assignedAmount };
  });

  return {
    ...settlement,
    totalPresenceDays: totalPresenceDaysAfter,
    totalAbsenceDays: settlement.totalAbsenceDays + absenceDaysAdded,
    members: adjustedRows,
  };
}

export function calculateAbsenceImpact(
  params: {
    members: AbsenceMember[];
    settlement: MonthlySettlementSummary | null;
    week: TaskWeek | null;
    draft: Pick<AbsenceDraft, "membershipId" | "periodStart" | "periodEnd">;
  },
): AbsenceImpactSummary | null {
  const month = params.settlement?.month ?? normalizeMonth(params.draft.periodStart);
  const period = monthRange(month);
  const targetRange = {
    start: compareDates(params.draft.periodStart, period.from) > 0 ? normalizeDate(params.draft.periodStart) : period.from,
    end: compareDates(params.draft.periodEnd, addDays(period.to, -1)) < 0 ? normalizeDate(params.draft.periodEnd) : addDays(period.to, -1),
  };
  const absenceDaysAdded = compareDates(targetRange.start, targetRange.end) <= 0 ? daysBetweenInclusive(targetRange.start, targetRange.end) : 0;
  const settlementAfter = calculateProjectedSettlement(params.settlement, params.draft.membershipId, absenceDaysAdded);
  const member = params.members.find((item) => item.membershipId === params.draft.membershipId);
  const rowBefore = params.settlement?.members.find((item) => item.membershipId === params.draft.membershipId);
  const rowAfter = settlementAfter?.members.find((item) => item.membershipId === params.draft.membershipId);
  const affectedTasks = countAffectedTasks(params.week, params.draft.membershipId, targetRange);

  if (!member || !rowBefore || !rowAfter) {
    return null;
  }

  return {
    month,
    totalPresenceDaysBefore: params.settlement?.totalPresenceDays ?? 0,
    totalPresenceDaysAfter: settlementAfter?.totalPresenceDays ?? 0,
    totalAssignedAmountBefore: params.settlement?.totalAmount ?? 0,
    totalAssignedAmountAfter: settlementAfter?.totalAmount ?? 0,
    affectedTasks,
    rows: [
      {
        membershipId: member.membershipId,
        displayName: member.displayName,
        presenceDaysBefore: rowBefore.presenceDays,
        presenceDaysAfter: rowAfter.presenceDays,
        absenceDaysAdded,
        assignedAmountBefore: rowBefore.assignedAmount,
        assignedAmountAfter: rowAfter.assignedAmount,
        affectedTasks,
      },
    ],
  };
}

export function countAffectedTasks(
  week: TaskWeek | null,
  membershipId: string,
  draftRange: DateRange,
): number {
  if (!week) return 0;
  if (!rangeOverlaps(
    { start: week.weekStart, end: week.weekEnd },
    draftRange,
  )) {
    return 0;
  }
  return week.tasks.reduce(
    (sum, task) =>
      sum +
      task.assignments.filter(
        (assignment) => assignment.membershipId === membershipId && assignment.status === "PENDING",
      ).length,
    0,
  );
}
