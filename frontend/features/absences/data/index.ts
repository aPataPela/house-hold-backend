import type {
  Absence as AbsenceApiModel,
  CancelAbsenceCommand,
  CreateAbsenceCommand,
  Member as MemberApiModel,
  MonthlySettlement as MonthlySettlementApiModel,
  TaskWeek as TaskWeekApiModel,
} from "@/data-access/models";
import {
  createAbsencesHttpRepository,
  createFakeAbsencesRepository,
  createFakeAbsencesRepositoryFromStore,
  createMembersHttpRepository,
  createFakeMembersRepositoryFromStore,
  createPresenceHttpRepository,
  createFakePresenceRepositoryFromStore,
  createTasksHttpRepository,
  createFakeTasksRepositoryFromStore,
  type AbsencesRepository,
  type MembersRepository,
  type PresenceRepository,
  type TasksRepository,
} from "@/data-access";
import { createFakeDataStore } from "@/data-access/core/fake-store";
import type { RequestContext } from "@/data-access/core/types";
import type {
  AbsenceDraft,
  AbsenceMember,
  AbsenceRecord,
  MonthlySettlementSummary,
  TaskWeek,
} from "../domain";

export type AbsenceDto = AbsenceApiModel;
export type MemberDto = MemberApiModel;
export type MonthlySettlementDto = MonthlySettlementApiModel;
export type TaskWeekDto = TaskWeekApiModel;

export interface AbsencesFeatureRepository {
  listMembers(householdId: string, context?: RequestContext): Promise<AbsenceMember[]>;
  listAbsences(
    householdId: string,
    query: { from: string | Date; to: string | Date },
    context?: RequestContext,
  ): Promise<AbsenceRecord[]>;
  loadSettlement(
    householdId: string,
    month: string | Date,
    context?: RequestContext,
  ): Promise<MonthlySettlementSummary>;
  loadTaskWeek(
    householdId: string,
    weekStart: string | Date,
    context?: RequestContext,
  ): Promise<TaskWeek>;
  createAbsence(
    householdId: string,
    draft: AbsenceDraft,
    context?: RequestContext,
  ): Promise<AbsenceRecord>;
  cancelAbsence(
    householdId: string,
    absenceId: string,
    cancelledByMembershipId: string,
    context?: RequestContext,
  ): Promise<AbsenceRecord>;
}

export function mapMemberDtoToDomain(dto: MemberDto): AbsenceMember {
  return {
    membershipId: dto.membershipId,
    householdId: dto.householdId,
    displayName: dto.userName ?? dto.userId,
    role: dto.role,
    livingSince: dto.livingSince.slice(0, 10),
    status: dto.status,
  };
}

export function mapAbsenceDtoToDomain(dto: AbsenceDto, householdId = ""): AbsenceRecord {
  return {
    absenceId: dto.absenceId,
    householdId,
    membershipId: dto.membershipId,
    status: dto.status,
    periodStart: dto.periodStart.slice(0, 10),
    periodEnd: dto.periodEnd.slice(0, 10),
    reason: dto.reason,
    audit: {
      createdByMembershipId: dto.audit.createdByMembershipId,
      createdAt: dto.audit.createdAt,
      ...(dto.audit.cancelledByMembershipId
        ? { cancelledByMembershipId: dto.audit.cancelledByMembershipId }
        : {}),
      ...(dto.audit.cancelledAt ? { cancelledAt: dto.audit.cancelledAt } : {}),
    },
  };
}

export function mapSettlementDtoToDomain(dto: MonthlySettlementDto): MonthlySettlementSummary {
  return {
    householdId: dto.householdId,
    month: dto.month.slice(0, 7),
    totalAmount: dto.totalAmount,
    daysInMonth: dto.daysInMonth,
    totalMemberDays: dto.totalMemberDays,
    totalAbsenceDays: dto.totalAbsenceDays,
    totalPresenceDays: dto.totalPresenceDays,
    dailyAmount: dto.dailyAmount,
    members: dto.members.map((member) => ({ ...member })),
  };
}

export function mapTaskWeekDtoToDomain(dto: TaskWeekDto): TaskWeek {
  return {
    weekId: dto.weekId,
    householdId: dto.householdId,
    weekStart: dto.weekStart.slice(0, 10),
    weekEnd: dto.weekEnd.slice(0, 10),
    tasks: dto.tasks.map((task) => ({
      taskId: task.taskId,
      commonAreaId: task.commonAreaId,
      name: task.name,
      priority: task.priority,
      assigneeLimit: task.assigneeLimit,
      weeklyStatus: task.weeklyStatus,
      assignments: task.assignments.map((assignment) => ({ ...assignment })),
    })),
  };
}

export function mapDraftToCreateCommand(draft: AbsenceDraft): CreateAbsenceCommand {
  return {
    membershipId: draft.membershipId,
    periodStart: draft.periodStart,
    periodEnd: draft.periodEnd,
    ...(draft.reason ? { reason: draft.reason } : {}),
    createdByMembershipId: draft.createdByMembershipId,
  };
}

export function mapCancelCommand(cancelledByMembershipId: string): CancelAbsenceCommand {
  return { cancelledByMembershipId };
}

export function createAbsencesHttpGateway(options: { ttlMs?: number } = {}): AbsencesFeatureRepository {
  const members = createMembersHttpRepository(options);
  const absences = createAbsencesHttpRepository(options);
  const presence = createPresenceHttpRepository(options);
  const tasks = createTasksHttpRepository(options);

  return createGatewayFromRepositories({ members, absences, presence, tasks });
}

export function createFakeAbsencesGateway(seed: Parameters<typeof createFakeAbsencesRepository>[0] = {}): AbsencesFeatureRepository {
  const store = createFakeDataStore(seed);
  const members = createFakeMembersRepositoryFromStore(store);
  const absences = createFakeAbsencesRepositoryFromStore(store);
  const presence = createFakePresenceRepositoryFromStore(store);
  const tasks = createFakeTasksRepositoryFromStore(store);

  return createGatewayFromRepositories({ members, absences, presence, tasks });
}

function createGatewayFromRepositories(deps: {
  members: MembersRepository;
  absences: AbsencesRepository;
  presence: PresenceRepository;
  tasks: TasksRepository;
}): AbsencesFeatureRepository {
  return {
    async listMembers(householdId, context) {
      const response = await deps.members.list(householdId, context);
      return response.map((member) => mapMemberDtoToDomain(member as MemberDto));
    },
    async listAbsences(householdId, query, context) {
      const response = await deps.absences.list(householdId, query, context);
      return response.map((absence) => mapAbsenceDtoToDomain(absence as AbsenceDto, householdId));
    },
    async loadSettlement(householdId, month, context) {
      const response = await deps.absences.monthlySettlement(householdId, month, context);
      return mapSettlementDtoToDomain(response as MonthlySettlementDto);
    },
    async loadTaskWeek(householdId, weekStart, context) {
      const response = await deps.tasks.getWeek(householdId, weekStart, context);
      return mapTaskWeekDtoToDomain(response as TaskWeekDto);
    },
    async createAbsence(householdId, draft, context) {
      const response = await deps.absences.create(householdId, mapDraftToCreateCommand(draft), context);
      return mapAbsenceDtoToDomain(response as AbsenceDto, householdId);
    },
    async cancelAbsence(householdId, absenceId, cancelledByMembershipId, context) {
      const response = await deps.absences.cancel(
        householdId,
        absenceId,
        mapCancelCommand(cancelledByMembershipId),
        context,
      );
      return mapAbsenceDtoToDomain(response as AbsenceDto, householdId);
    },
  };
}
