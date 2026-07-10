import { randomUUID } from "node:crypto";
import type {
  ChoreAssignment,
  ChoreAssignmentStatus,
  ChoreTask,
  ChoreWeek,
  CommonArea,
  Membership,
} from "../../shared/types/entities";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors/app-error";
import { parseDate } from "../../shared/utils/date";
import { activeMembershipCriteria, effectiveMembershipStart } from "../../shared/utils/membership";
import { HouseholdModel } from "../../households/models/household.model";
import { MembershipModel } from "../../households/models/membership.model";
import { CommonAreaModel } from "../models/common-area.model";
import { ChoreTaskModel } from "../models/chore-task.model";
import { ChoreWeekModel } from "../models/chore-week.model";
import { ChoreAssignmentModel } from "../models/chore-assignment.model";

const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const plain = <T>(doc: unknown): T => doc as T;
const normalize = (value: string) => value.trim().toLocaleLowerCase("es");

export type ChoreTaskSummary = {
  task: ChoreTask;
  commonArea: CommonArea;
};

export type ChoreWeekTask = ChoreTaskSummary & {
  status: ChoreAssignmentStatus;
  assignments: ChoreAssignment[];
};

export class ChoreService {
  constructor(private readonly now = () => new Date()) {}

  async createCommonArea(
    householdId: string,
    input: { name: string; createdByMembershipId: string },
  ): Promise<CommonArea> {
    await this.assertAdmin(householdId, input.createdByMembershipId);
    const normalizedName = normalize(input.name);
    if (await CommonAreaModel.findOne({ householdId, normalizedName, status: "ACTIVE" }).lean()) {
      throw conflict("COMMON_AREA_EXISTS", "common area name already exists");
    }
    const area: CommonArea = {
      id: id("area"),
      householdId,
      name: input.name.trim(),
      normalizedName,
      status: "ACTIVE",
      createdByMembershipId: input.createdByMembershipId,
      createdAt: this.now(),
    };
    await CommonAreaModel.create({ ...area, _id: area.id });
    return area;
  }

  async createTask(
    householdId: string,
    input: {
      commonAreaId: string;
      name: string;
      priority: number;
      assigneeLimit: number;
      createdByMembershipId: string;
    },
  ): Promise<ChoreTask> {
    await this.assertAdmin(householdId, input.createdByMembershipId);
    if (!(await this.findCommonArea(householdId, input.commonAreaId))) throw notFound("common area");
    const normalizedName = normalize(input.name);
    if (
      await ChoreTaskModel.findOne({
        householdId,
        commonAreaId: input.commonAreaId,
        normalizedName,
        status: "ACTIVE",
      }).lean()
    ) {
      throw conflict("CHORE_TASK_EXISTS", "chore task name already exists for common area");
    }
    const task: ChoreTask = {
      id: id("task"),
      householdId,
      commonAreaId: input.commonAreaId,
      name: input.name.trim(),
      normalizedName,
      priority: input.priority,
      assigneeLimit: input.assigneeLimit,
      status: "ACTIVE",
      createdByMembershipId: input.createdByMembershipId,
      createdAt: this.now(),
    };
    await ChoreTaskModel.create({ ...task, _id: task.id });
    return task;
  }

  async listTasks(householdId: string): Promise<ChoreTaskSummary[]> {
    if (!(await HouseholdModel.exists({ _id: householdId }))) throw notFound("household");
    const tasks = plain<ChoreTask[]>(
      await ChoreTaskModel.find({ householdId, status: "ACTIVE" }).sort({ priority: 1, createdAt: 1 }).lean(),
    );
    const areas = await this.findAreasById(
      householdId,
      tasks.map((task) => task.commonAreaId),
    );
    return tasks.map((task) => ({ task, commonArea: areas.get(task.commonAreaId) as CommonArea }));
  }

  async listCommonAreas(householdId: string, input: { requesterUserId: string }): Promise<CommonArea[]> {
    if (!(await HouseholdModel.exists({ _id: householdId }))) throw notFound("household");
    if (!(await this.findActiveMembershipByUser(householdId, input.requesterUserId))) {
      throw forbidden("an active membership is required");
    }
    return plain<CommonArea[]>(
      await CommonAreaModel.find({ householdId, status: "ACTIVE" }).sort({ createdAt: 1 }).lean(),
    );
  }

  async generateWeek(
    householdId: string,
    input: { weekStart: string; createdByMembershipId: string },
  ): Promise<{ week: ChoreWeek; tasks: ChoreWeekTask[] }> {
    await this.assertAdmin(householdId, input.createdByMembershipId);
    const weekStart = this.parseWeekStart(input.weekStart);
    const existing = await this.findWeek(householdId, weekStart);
    if (existing) return this.getWeekByDocument(existing);

    const members = await this.findActiveMembers(householdId, weekStart);
    if (members.length === 0) throw badRequest("NO_ACTIVE_MEMBERS", "household has no active members");
    const taskSummaries = await this.listTasks(householdId);
    if (taskSummaries.length === 0)
      throw badRequest("NO_ACTIVE_CHORE_TASKS", "household has no active chore tasks");

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    const week: ChoreWeek = {
      id: id("cw"),
      householdId,
      weekStart,
      weekEnd,
      createdByMembershipId: input.createdByMembershipId,
      createdAt: this.now(),
    };
    const assignments = await this.buildAssignments(
      week,
      taskSummaries.map((summary) => summary.task),
      members,
    );
    await ChoreWeekModel.create({ ...week, _id: week.id });
    if (assignments.length > 0) {
      await ChoreAssignmentModel.insertMany(
        assignments.map((assignment) => ({ ...assignment, _id: assignment.id })),
      );
    }
    return this.getWeekByDocument(week);
  }

  async getWeek(
    householdId: string,
    weekStartValue: string,
  ): Promise<{ week: ChoreWeek; tasks: ChoreWeekTask[] }> {
    const weekStart = this.parseWeekStart(weekStartValue);
    const week = await this.findWeek(householdId, weekStart);
    if (!week) throw notFound("chore week");
    return this.getWeekByDocument(week);
  }

  async markAssignment(
    householdId: string,
    assignmentId: string,
    input: { status: "DONE" | "NOT_DONE"; markedByMembershipId: string },
  ): Promise<ChoreAssignment> {
    const assignment = plain<ChoreAssignment | null>(
      await ChoreAssignmentModel.findOne({ _id: assignmentId, householdId }).lean(),
    );
    if (!assignment) throw notFound("chore assignment");
    if (assignment.membershipId !== input.markedByMembershipId) {
      throw forbidden("only the assigned member can mark this chore assignment");
    }
    if (!(await this.findActiveMembership(householdId, input.markedByMembershipId, assignment.weekStart))) {
      throw forbidden("an active assigned membership is required");
    }
    const updated = plain<ChoreAssignment | null>(
      await ChoreAssignmentModel.findByIdAndUpdate(
        assignment.id,
        {
          $set: {
            status: input.status,
            markedByMembershipId: input.markedByMembershipId,
            markedAt: this.now(),
          },
        },
        { new: true },
      ).lean(),
    );
    return updated as ChoreAssignment;
  }

  private async buildAssignments(
    week: ChoreWeek,
    tasks: ChoreTask[],
    members: Membership[],
  ): Promise<ChoreAssignment[]> {
    const history = await this.getHistory(week.householdId, week.weekStart);
    const availableMembers = [...members].sort(
      (a, b) =>
        effectiveMembershipStart(a).getTime() - effectiveMembershipStart(b).getTime() ||
        a.id.localeCompare(b.id),
    );
    const assigned = new Set<string>();
    const assignments: ChoreAssignment[] = [];
    const slots = [
      ...tasks.map((task) => task),
      ...tasks.flatMap((task) => Array.from({ length: task.assigneeLimit - 1 }, () => task)),
    ];
    for (const task of slots) {
      const member = this.selectMember(task.id, availableMembers, assigned, history);
      if (!member) continue;
      assigned.add(member.id);
      history.total.set(member.id, (history.total.get(member.id) ?? 0) + 1);
      history.byTask.set(`${task.id}:${member.id}`, (history.byTask.get(`${task.id}:${member.id}`) ?? 0) + 1);
      assignments.push({
        id: id("assign"),
        householdId: week.householdId,
        weekId: week.id,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        commonAreaId: task.commonAreaId,
        taskId: task.id,
        membershipId: member.id,
        status: "PENDING",
        createdAt: this.now(),
      });
    }
    return assignments;
  }

  private selectMember(
    taskId: string,
    members: Membership[],
    assigned: Set<string>,
    history: { byTask: Map<string, number>; total: Map<string, number> },
  ): Membership | undefined {
    return members
      .filter((member) => !assigned.has(member.id))
      .sort((a, b) => {
        const taskDiff =
          (history.byTask.get(`${taskId}:${a.id}`) ?? 0) - (history.byTask.get(`${taskId}:${b.id}`) ?? 0);
        if (taskDiff !== 0) return taskDiff;
        const totalDiff = (history.total.get(a.id) ?? 0) - (history.total.get(b.id) ?? 0);
        if (totalDiff !== 0) return totalDiff;
        return a.id.localeCompare(b.id);
      })[0];
  }

  private async getHistory(householdId: string, weekStart: Date) {
    const previous = plain<ChoreAssignment[]>(
      await ChoreAssignmentModel.find({ householdId, weekStart: { $lt: weekStart } }).lean(),
    );
    const byTask = new Map<string, number>();
    const total = new Map<string, number>();
    for (const assignment of previous) {
      byTask.set(
        `${assignment.taskId}:${assignment.membershipId}`,
        (byTask.get(`${assignment.taskId}:${assignment.membershipId}`) ?? 0) + 1,
      );
      total.set(assignment.membershipId, (total.get(assignment.membershipId) ?? 0) + 1);
    }
    return { byTask, total };
  }

  private async getWeekByDocument(week: ChoreWeek): Promise<{ week: ChoreWeek; tasks: ChoreWeekTask[] }> {
    const assignments = plain<ChoreAssignment[]>(
      await ChoreAssignmentModel.find({ weekId: week.id }).sort({ taskId: 1, membershipId: 1 }).lean(),
    );
    const taskIds = Array.from(new Set(assignments.map((assignment) => assignment.taskId)));
    const areaIds = Array.from(new Set(assignments.map((assignment) => assignment.commonAreaId)));
    const tasks = plain<ChoreTask[]>(
      await ChoreTaskModel.find({ _id: { $in: taskIds } })
        .sort({ priority: 1, createdAt: 1 })
        .lean(),
    );
    const areas = await this.findAreasById(week.householdId, areaIds);
    const taskIdsByPriority = tasks.map((task) => task.id);
    return {
      week,
      tasks: taskIdsByPriority.map((taskId) => {
        const taskAssignments = assignments.filter((assignment) => assignment.taskId === taskId);
        const task = tasks.find((value) => value.id === taskId) as ChoreTask;
        return {
          task,
          commonArea: areas.get(task.commonAreaId) as CommonArea,
          assignments: taskAssignments,
          status: this.deriveTaskStatus(taskAssignments),
        };
      }),
    };
  }

  private deriveTaskStatus(assignments: ChoreAssignment[]): ChoreAssignmentStatus {
    if (assignments.length > 0 && assignments.every((assignment) => assignment.status === "DONE"))
      return "DONE";
    if (assignments.some((assignment) => assignment.status === "NOT_DONE")) return "NOT_DONE";
    return "PENDING";
  }

  private parseWeekStart(value: string): Date {
    const weekStart = parseDate(value, "weekStart");
    if (weekStart.getUTCDay() !== 1) throw badRequest("INVALID_WEEK_START", "weekStart must be a Monday");
    return weekStart;
  }

  private async assertAdmin(householdId: string, membershipId: string): Promise<void> {
    if (!(await HouseholdModel.exists({ _id: householdId }))) throw notFound("household");
    const membership = await this.findActiveMembership(householdId, membershipId);
    if (!membership || membership.role !== "ADMIN") throw forbidden("only an active ADMIN can manage chores");
  }

  private async findActiveMembership(householdId: string, membershipId: string, date = new Date()) {
    return plain<Membership | null>(
      await MembershipModel.findOne({
        _id: membershipId,
        householdId,
        ...activeMembershipCriteria(date),
      }).lean(),
    );
  }

  private async findActiveMembershipByUser(householdId: string, userId: string) {
    return plain<Membership | null>(
      await MembershipModel.findOne({ householdId, userId, status: "ACTIVE" }).lean(),
    );
  }

  private async findActiveMembers(householdId: string, date: Date) {
    return plain<Membership[]>(
      await MembershipModel.find({ householdId, ...activeMembershipCriteria(date) }).lean(),
    );
  }

  private async findCommonArea(householdId: string, commonAreaId: string) {
    return plain<CommonArea | null>(
      await CommonAreaModel.findOne({ _id: commonAreaId, householdId, status: "ACTIVE" }).lean(),
    );
  }

  private async findWeek(householdId: string, weekStart: Date) {
    return plain<ChoreWeek | null>(await ChoreWeekModel.findOne({ householdId, weekStart }).lean());
  }

  private async findAreasById(householdId: string, areaIds: string[]) {
    const areas = plain<CommonArea[]>(
      await CommonAreaModel.find({ householdId, _id: { $in: areaIds } }).lean(),
    );
    return new Map(areas.map((area) => [area.id, area]));
  }
}
