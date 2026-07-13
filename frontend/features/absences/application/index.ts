import type {
  AbsenceActor,
  AbsenceDraft,
  AbsencePermissionSnapshot,
  AbsenceRecord,
  AbsenceConflict,
  AbsenceMember,
  MonthlySettlementSummary,
  TaskWeek,
} from "../domain";
import {
  calculateAbsenceImpact,
  createAbsencePermissionPolicy,
  findAbsenceConflicts,
  normalizeDate,
} from "../domain";

export type AbsenceApplicationErrorCode =
  | "FORBIDDEN"
  | "CONFLICT"
  | "NOT_FOUND"
  | "INVALID_DATES"
  | "UNKNOWN";

export class AbsenceApplicationError extends Error {
  constructor(
    public readonly code: AbsenceApplicationErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AbsenceApplicationError";
  }
}

export interface CreateAbsenceInput {
  actor: AbsenceActor;
  draft: AbsenceDraft;
  members: AbsenceMember[];
  absences: AbsenceRecord[];
  settlement: MonthlySettlementSummary | null;
  week: TaskWeek | null;
}

export interface CancelAbsenceInput {
  actor: AbsenceActor;
  absenceId: string;
  absences: AbsenceRecord[];
}

export interface AbsencePageInput {
  actor: AbsenceActor;
  members: AbsenceMember[];
  absences: AbsenceRecord[];
  settlement: MonthlySettlementSummary | null;
  week: TaskWeek | null;
  month: string;
}

export interface AbsencePageViewModel {
  permissions: AbsencePermissionSnapshot;
  selectableMembers: Array<{
    membershipId: string;
    label: string;
    isCurrent: boolean;
    disabled: boolean;
  }>;
  defaultMembershipId: string;
  conflicts: AbsenceConflict[];
  impact: ReturnType<typeof calculateAbsenceImpact>;
  emptyState: boolean;
}

export function buildAbsencePageViewModel(input: AbsencePageInput): AbsencePageViewModel {
  const permissions = createAbsencePermissionPolicy(input.actor);
  const selectableMembers = input.members.map((member) => ({
    membershipId: member.membershipId,
    label: member.displayName,
    isCurrent: member.membershipId === input.actor.membershipId,
    disabled: !permissions.canCreateForOthers && member.membershipId !== input.actor.membershipId,
  }));

  const defaultMembershipId =
    selectableMembers.find((item) => item.isCurrent)?.membershipId ?? selectableMembers[0]?.membershipId ?? "";

  const draft: AbsenceDraft = {
    membershipId: defaultMembershipId,
    periodStart: normalizeDate(input.settlement?.month ? `${input.settlement.month}-01` : input.month + "-01"),
    periodEnd: normalizeDate(input.settlement?.month ? `${input.settlement.month}-01` : input.month + "-01"),
    createdByMembershipId: input.actor.membershipId,
  };
  const conflicts = findAbsenceConflicts(draft, input.absences);
  const impact = calculateAbsenceImpact({
    members: input.members,
    settlement: input.settlement,
    week: input.week,
    draft,
  });

  return {
    permissions,
    selectableMembers,
    defaultMembershipId,
    conflicts,
    impact,
    emptyState: input.absences.length === 0,
  };
}

export function createAbsenceUseCase(dependencies: {
  permissionPolicy?: (actor: AbsenceActor) => AbsencePermissionSnapshot;
  createAbsence: (draft: AbsenceDraft) => Promise<AbsenceRecord>;
}) {
  return async function execute(input: CreateAbsenceInput): Promise<{
    absence: AbsenceRecord;
    conflicts: AbsenceConflict[];
  }> {
    if (normalizeDate(input.draft.periodEnd) < normalizeDate(input.draft.periodStart)) {
      throw new AbsenceApplicationError("INVALID_DATES", "La fecha de término debe ser igual o posterior a la fecha de inicio.");
    }

    const policy = dependencies.permissionPolicy?.(input.actor) ?? createAbsencePermissionPolicy(input.actor);
    if (input.draft.membershipId === input.actor.membershipId) {
      if (!policy.canCreateForSelf) {
        throw new AbsenceApplicationError("FORBIDDEN", "No tienes permiso para registrar tu ausencia.");
      }
    } else if (!policy.canCreateForOthers) {
      throw new AbsenceApplicationError("FORBIDDEN", "No tienes permiso para registrar ausencias de otras personas.");
    }

    const conflicts = findAbsenceConflicts(input.draft, input.absences);
    if (conflicts.length > 0) {
      throw new AbsenceApplicationError("CONFLICT", "La ausencia se superpone con otra ausencia activa.", conflicts);
    }

    const absence = await dependencies.createAbsence(input.draft);
    return { absence, conflicts };
  };
}

export function createCancelAbsenceUseCase(dependencies: {
  permissionPolicy?: (actor: AbsenceActor) => AbsencePermissionSnapshot;
  cancelAbsence: (absenceId: string) => Promise<AbsenceRecord>;
}) {
  return async function execute(input: CancelAbsenceInput): Promise<AbsenceRecord> {
    const target = input.absences.find((absence) => absence.absenceId === input.absenceId);
    if (!target) {
      throw new AbsenceApplicationError("NOT_FOUND", "No encontramos la ausencia a cancelar.");
    }

    const policy = dependencies.permissionPolicy?.(input.actor) ?? createAbsencePermissionPolicy(input.actor);
    if (target.membershipId === input.actor.membershipId) {
      if (!policy.canCancelOwn) {
        throw new AbsenceApplicationError("FORBIDDEN", "No tienes permiso para cancelar tu ausencia.");
      }
    } else if (!policy.canCancelOthers) {
      throw new AbsenceApplicationError("FORBIDDEN", "No tienes permiso para cancelar ausencias de otras personas.");
    }

    return dependencies.cancelAbsence(input.absenceId);
  };
}

