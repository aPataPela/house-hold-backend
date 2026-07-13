import { requestJson } from "../core/http-client";
import { RepositoryCache, cacheKey } from "../core/cache";
import { DataAccessError } from "../core/errors";
import {
  addDays,
  compareDates,
  normalizeDate,
} from "../core/normalize";
import type { RequestContext } from "../core/types";
import {
  createFakeDataStore,
  createFakeId,
  type FakeDataStore,
  type FakeDataStoreSeed,
} from "../core/fake-store";
import type {
  CommonArea,
  CreateCommonAreaCommand,
  CreateTaskCommand,
  GenerateTaskWeekCommand,
  HouseTask,
  MarkTaskAssignmentCommand,
  TaskAssignment,
  TaskAssignmentStatus,
  TaskWeek,
  TaskWeekTask,
} from "../models";
import type { Absence } from "../models";
import type { Member } from "../models";

export interface CommonAreaDto {
  commonAreaId: string;
  householdId: string;
  name: string;
  status: CommonArea["status"];
  createdByMembershipId: string;
  createdAt: string;
}

export interface TaskDto {
  choreTaskId: string;
  householdId: string;
  commonAreaId: string;
  commonArea?: CommonAreaDto;
  name: string;
  priority: number;
  assigneeLimit: number;
  status: HouseTask["status"];
  createdByMembershipId: string;
  createdAt: string;
}

export interface TaskAssignmentDto {
  assignmentId: string;
  membershipId: string;
  status: TaskAssignment["status"];
  markedByMembershipId?: string;
  markedAt?: string;
}

export interface TaskWeekTaskDto extends TaskDto {
  weeklyStatus: TaskAssignmentStatus;
  assignments: TaskAssignmentDto[];
}

export interface TaskWeekDto {
  choreWeekId: string;
  householdId: string;
  weekStart: string;
  weekEnd: string;
  createdByMembershipId: string;
  createdAt: string;
  tasks: TaskWeekTaskDto[];
}

export interface CommonAreasResponseDto {
  areas: CommonAreaDto[];
}

export interface TasksResponseDto {
  tasks: TaskDto[];
}

export type TaskWeekResponseDto = TaskWeekDto;

export interface TasksRepository {
  listCommonAreas(householdId: string, context?: RequestContext): Promise<CommonArea[]>;
  createCommonArea(
    householdId: string,
    command: CreateCommonAreaCommand,
    context?: RequestContext,
  ): Promise<CommonArea>;
  listTasks(householdId: string, context?: RequestContext): Promise<HouseTask[]>;
  createTask(
    householdId: string,
    command: CreateTaskCommand,
    context?: RequestContext,
  ): Promise<HouseTask>;
  generateWeek(
    householdId: string,
    command: GenerateTaskWeekCommand,
    context?: RequestContext,
  ): Promise<TaskWeek>;
  getWeek(
    householdId: string,
    weekStart: string | Date,
    context?: RequestContext,
  ): Promise<TaskWeek>;
  markAssignment(
    householdId: string,
    assignmentId: string,
    command: MarkTaskAssignmentCommand,
    context?: RequestContext,
  ): Promise<TaskAssignment>;
}

export function mapCommonAreaDtoToCommonArea(dto: CommonAreaDto): CommonArea {
  return {
    commonAreaId: dto.commonAreaId,
    householdId: dto.householdId,
    name: dto.name,
    status: dto.status,
    createdByMembershipId: dto.createdByMembershipId,
    createdAt: normalizeDateTime(dto.createdAt),
  };
}

export function mapCommonAreaToDto(commonArea: CommonArea): CommonAreaDto {
  return {
    commonAreaId: commonArea.commonAreaId,
    householdId: commonArea.householdId,
    name: commonArea.name,
    status: commonArea.status,
    createdByMembershipId: commonArea.createdByMembershipId,
    createdAt: commonArea.createdAt,
  };
}

export function mapTaskDtoToTask(dto: TaskDto): HouseTask {
  return {
    taskId: dto.choreTaskId,
    householdId: dto.householdId,
    commonAreaId: dto.commonAreaId,
    commonArea: dto.commonArea ? mapCommonAreaDtoToCommonArea(dto.commonArea) : undefined,
    name: dto.name,
    priority: dto.priority,
    assigneeLimit: dto.assigneeLimit,
    status: dto.status,
    createdByMembershipId: dto.createdByMembershipId,
    createdAt: normalizeDateTime(dto.createdAt),
  };
}

export function mapTaskToDto(task: HouseTask): TaskDto {
  return {
    choreTaskId: task.taskId,
    householdId: task.householdId,
    commonAreaId: task.commonAreaId,
    ...(task.commonArea ? { commonArea: mapCommonAreaToDto(task.commonArea) } : {}),
    name: task.name,
    priority: task.priority,
    assigneeLimit: task.assigneeLimit,
    status: task.status,
    createdByMembershipId: task.createdByMembershipId,
    createdAt: task.createdAt,
  };
}

export function mapTaskAssignmentDtoToTaskAssignment(dto: TaskAssignmentDto): TaskAssignment {
  return {
    assignmentId: dto.assignmentId,
    membershipId: dto.membershipId,
    status: dto.status,
    ...(dto.markedByMembershipId ? { markedByMembershipId: dto.markedByMembershipId } : {}),
    ...(dto.markedAt ? { markedAt: normalizeDateTime(dto.markedAt) } : {}),
  };
}

export function mapTaskAssignmentToDto(taskAssignment: TaskAssignment): TaskAssignmentDto {
  return {
    assignmentId: taskAssignment.assignmentId,
    membershipId: taskAssignment.membershipId,
    status: taskAssignment.status,
    ...(taskAssignment.markedByMembershipId
      ? { markedByMembershipId: taskAssignment.markedByMembershipId }
      : {}),
    ...(taskAssignment.markedAt ? { markedAt: taskAssignment.markedAt } : {}),
  };
}

export function mapTaskWeekDtoToTaskWeek(dto: TaskWeekDto): TaskWeek {
  return {
    weekId: dto.choreWeekId,
    householdId: dto.householdId,
    weekStart: normalizeDate(dto.weekStart),
    weekEnd: normalizeDate(dto.weekEnd),
    createdByMembershipId: dto.createdByMembershipId,
    createdAt: normalizeDateTime(dto.createdAt),
    tasks: dto.tasks.map(mapTaskWeekTaskDtoToTaskWeekTask),
  };
}

export function mapTaskWeekToDto(taskWeek: TaskWeek): TaskWeekDto {
  return {
    choreWeekId: taskWeek.weekId,
    householdId: taskWeek.householdId,
    weekStart: normalizeDate(taskWeek.weekStart),
    weekEnd: normalizeDate(taskWeek.weekEnd),
    createdByMembershipId: taskWeek.createdByMembershipId,
    createdAt: taskWeek.createdAt,
    tasks: taskWeek.tasks.map(mapTaskWeekTaskToDto),
  };
}

export function mapTaskWeekTaskDtoToTaskWeekTask(dto: TaskWeekTaskDto): TaskWeekTask {
  return {
    ...mapTaskDtoToTask(dto),
    weeklyStatus: dto.weeklyStatus,
    assignments: dto.assignments.map(mapTaskAssignmentDtoToTaskAssignment),
  };
}

export function mapTaskWeekTaskToDto(task: TaskWeekTask): TaskWeekTaskDto {
  return {
    ...mapTaskToDto(task),
    weeklyStatus: task.weeklyStatus,
    assignments: task.assignments.map(mapTaskAssignmentToDto),
  };
}

export function mapCreateCommonAreaCommandToDto(command: CreateCommonAreaCommand) {
  return {
    name: command.name,
    createdByMembershipId: command.createdByMembershipId,
  };
}

export function mapCreateTaskCommandToDto(command: CreateTaskCommand) {
  return {
    commonAreaId: command.commonAreaId,
    name: command.name,
    priority: command.priority,
    assigneeLimit: command.assigneeLimit,
    createdByMembershipId: command.createdByMembershipId,
  };
}

export function mapGenerateTaskWeekCommandToDto(command: GenerateTaskWeekCommand) {
  return {
    weekStart: normalizeDate(command.weekStart),
    createdByMembershipId: command.createdByMembershipId,
  };
}

export function mapMarkTaskAssignmentCommandToDto(command: MarkTaskAssignmentCommand) {
  return command;
}

export function createTasksHttpRepository(options: { ttlMs?: number } = {}): TasksRepository {
  const cache = new RepositoryCache<CommonArea[] | HouseTask[] | TaskWeek | TaskAssignment>({ ttlMs: options.ttlMs });

  return {
    async listCommonAreas(householdId, context) {
      const key = cacheKey("tasks:areas", householdId);
      if (!context?.forceRefresh) {
        const cached = cache.get(key);
        if (cached) return (cached as CommonArea[]).map((area) => ({ ...area }));
      }

      const response = await requestJson<CommonAreasResponseDto>(
        `/api/v1/households/${householdId}/common-areas`,
        { accessToken: context?.accessToken, signal: context?.signal },
      );
      const areas = response.areas.map(mapCommonAreaDtoToCommonArea);
      cache.set(key, areas);
      return areas.map((area) => ({ ...area }));
    },

    async createCommonArea(householdId, command, context) {
      const response = await requestJson<CommonAreaDto>(`/api/v1/households/${householdId}/common-areas`, {
        method: "POST",
        body: JSON.stringify(mapCreateCommonAreaCommandToDto(command)),
        accessToken: context?.accessToken,
        signal: context?.signal,
      });
      cache.invalidatePrefix("tasks:");
      return mapCommonAreaDtoToCommonArea(response);
    },

    async listTasks(householdId, context) {
      const key = cacheKey("tasks:list", householdId);
      if (!context?.forceRefresh) {
        const cached = cache.get(key);
        if (cached) return (cached as HouseTask[]).map((task) => ({ ...task, commonArea: task.commonArea ? { ...task.commonArea } : undefined }));
      }

      const response = await requestJson<TasksResponseDto>(`/api/v1/households/${householdId}/chores/tasks`, {
        accessToken: context?.accessToken,
        signal: context?.signal,
      });
      const tasks = response.tasks.map(mapTaskDtoToTask);
      cache.set(key, tasks);
      return tasks.map((task) => ({ ...task, commonArea: task.commonArea ? { ...task.commonArea } : undefined }));
    },

    async createTask(householdId, command, context) {
      const response = await requestJson<TaskDto>(`/api/v1/households/${householdId}/chores/tasks`, {
        method: "POST",
        body: JSON.stringify(mapCreateTaskCommandToDto(command)),
        accessToken: context?.accessToken,
        signal: context?.signal,
      });
      cache.invalidatePrefix("tasks:");
      return mapTaskDtoToTask(response);
    },

    async generateWeek(householdId, command, context) {
      const response = await requestJson<TaskWeekDto>(`/api/v1/households/${householdId}/chores/weeks`, {
        method: "POST",
        body: JSON.stringify(mapGenerateTaskWeekCommandToDto(command)),
        accessToken: context?.accessToken,
        signal: context?.signal,
      });
      cache.invalidatePrefix("tasks:week:");
      return mapTaskWeekDtoToTaskWeek(response);
    },

    async getWeek(householdId, weekStart, context) {
      const normalizedWeekStart = normalizeDate(weekStart);
      const key = cacheKey("tasks:week", householdId, normalizedWeekStart);
      if (!context?.forceRefresh) {
        const cached = cache.get(key);
        if (cached) return { ...(cached as TaskWeek), tasks: (cached as TaskWeek).tasks.map((task) => ({ ...task, assignments: task.assignments.map((assignment) => ({ ...assignment })) })) };
      }

      const response = await requestJson<TaskWeekDto>(
        `/api/v1/households/${householdId}/chores/weeks/${normalizedWeekStart}`,
        { accessToken: context?.accessToken, signal: context?.signal },
      );
      const week = mapTaskWeekDtoToTaskWeek(response);
      cache.set(key, week);
      return { ...week, tasks: week.tasks.map((task) => ({ ...task, assignments: task.assignments.map((assignment) => ({ ...assignment })) })) };
    },

    async markAssignment(householdId, assignmentId, command, context) {
      const response = await requestJson<TaskAssignmentDto>(
        `/api/v1/households/${householdId}/chores/assignments/${assignmentId}`,
        {
          method: "PATCH",
          body: JSON.stringify(mapMarkTaskAssignmentCommandToDto(command)),
          accessToken: context?.accessToken,
          signal: context?.signal,
        },
      );
      cache.invalidatePrefix("tasks:week:");
      return mapTaskAssignmentDtoToTaskAssignment(response);
    },
  };
}

export function createFakeTasksRepository(seed: FakeDataStoreSeed = {}): TasksRepository {
  const store = createFakeDataStore(seed);
  return createFakeTasksRepositoryFromStore(store);
}

export function createFakeTasksRepositoryFromStore(store: FakeDataStore): TasksRepository {
  return {
    async listCommonAreas(householdId) {
      return store.commonAreas
        .filter((area) => area.householdId === householdId)
        .map((area) => ({ ...area }));
    },
    async createCommonArea(householdId, command) {
      const now = new Date().toISOString();
      const area: CommonArea = {
        commonAreaId: createFakeId(store, "commonArea", "area"),
        householdId,
        name: command.name,
        status: "ACTIVE",
        createdByMembershipId: command.createdByMembershipId,
        createdAt: now,
      };
      store.commonAreas.push(area);
      return { ...area };
    },
    async listTasks(householdId) {
      return store.tasks
        .filter((task) => task.householdId === householdId)
        .map((task) => ({ ...task, commonArea: task.commonArea ? { ...task.commonArea } : undefined }));
    },
    async createTask(householdId, command) {
      const now = new Date().toISOString();
      const task: HouseTask = {
        taskId: createFakeId(store, "task", "task"),
        householdId,
        commonAreaId: command.commonAreaId,
        name: command.name,
        priority: command.priority,
        assigneeLimit: command.assigneeLimit,
        status: "ACTIVE",
        createdByMembershipId: command.createdByMembershipId,
        createdAt: now,
      };
      store.tasks.push(task);
      return { ...task };
    },
    async generateWeek(householdId, command) {
      const weekStart = normalizeDate(command.weekStart);
      const existing = store.weeks.find((week) => week.householdId === householdId && week.weekStart === weekStart);
      if (existing) return cloneWeek(existing);

      const weekEnd = addDays(weekStart, 6);
      const eligibleMembers = buildEligibleMembers(store.members, store.absences, householdId, weekStart, weekEnd);
      const tasks = store.tasks
        .filter((task) => task.householdId === householdId)
        .sort((a, b) => a.priority - b.priority || compareDates(a.createdAt, b.createdAt));
      const weekTasks = tasks.map((task) => {
        const assignments = eligibleMembers.slice(0, task.assigneeLimit).map((membershipId) => ({
          assignmentId: createFakeId(store, "assignment", "assignment"),
          membershipId,
          status: "PENDING" as const,
        }));
        const weekTask: TaskWeekTask = {
          ...task,
          weeklyStatus: deriveWeeklyStatus(assignments),
          assignments,
        };
        return weekTask;
      });
      const week: TaskWeek = {
        weekId: createFakeId(store, "week", "week"),
        householdId,
        weekStart,
        weekEnd,
        createdByMembershipId: command.createdByMembershipId,
        createdAt: new Date().toISOString(),
        tasks: weekTasks,
      };
      store.weeks.push(week);
      return cloneWeek(week);
    },
    async getWeek(householdId, weekStart) {
      const normalizedWeekStart = normalizeDate(weekStart);
      const week = store.weeks.find((item) => item.householdId === householdId && item.weekStart === normalizedWeekStart);
      if (!week) {
        throw new DataAccessError("NOT_FOUND", "Task week not found.");
      }
      return cloneWeek(week);
    },
    async markAssignment(householdId, assignmentId, command) {
      for (const week of store.weeks) {
        if (week.householdId !== householdId) continue;
        for (const task of week.tasks) {
          const assignment = task.assignments.find((item) => item.assignmentId === assignmentId);
          if (!assignment) continue;
          assignment.status = command.status;
          assignment.markedByMembershipId = command.markedByMembershipId;
          assignment.markedAt = new Date().toISOString();
          task.weeklyStatus = deriveWeeklyStatus(task.assignments);
          return { ...assignment };
        }
      }
      throw new DataAccessError("NOT_FOUND", "Task assignment not found.");
    },
  };
}

function cloneWeek(week: TaskWeek): TaskWeek {
  return {
    ...week,
    tasks: week.tasks.map((task) => ({
      ...task,
      commonArea: task.commonArea ? { ...task.commonArea } : undefined,
      assignments: task.assignments.map((assignment) => ({ ...assignment })),
    })),
  };
}

function deriveWeeklyStatus(assignments: TaskAssignment[]): TaskAssignmentStatus {
  if (assignments.every((assignment) => assignment.status === "DONE")) {
    return "DONE";
  }
  if (assignments.some((assignment) => assignment.status === "NOT_DONE")) {
    return "NOT_DONE";
  }
  return "PENDING";
}

function buildEligibleMembers(
  members: Member[],
  absences: Absence[],
  householdId: string,
  weekStart: string,
  weekEnd: string,
): string[] {
  return members
    .filter((member) => member.householdId === householdId && member.status === "ACTIVE")
    .filter((member) => compareDates(member.livingSince, weekEnd) <= 0)
    .filter((member) => {
      const overlappingAbsence = absences.some(
        (absence) =>
          absence.householdId === householdId &&
          absence.membershipId === member.membershipId &&
          absence.status === "ACTIVE" &&
          compareDates(absence.periodEnd, weekStart) >= 0 &&
          compareDates(absence.periodStart, weekEnd) <= 0,
      );
      return !overlappingAbsence;
    })
    .map((member) => member.membershipId)
    .sort();
}

function normalizeDateTime(value: string): string {
  return value.includes("T") ? value : `${normalizeDate(value)}T00:00:00.000Z`;
}
