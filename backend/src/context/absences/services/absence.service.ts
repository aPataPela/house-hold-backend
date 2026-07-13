import { randomUUID } from "node:crypto";
import type { Absence, MonthlySettlement } from "../../shared/types/entities";
import { badRequest, forbidden, notFound } from "../../shared/errors/app-error";
import { calculateWeightedSplit } from "../../shared/utils/weighted-split";
import { parseDate } from "../../shared/utils/date";
import { activeMembershipCriteria, effectiveMembershipStart } from "../../shared/utils/membership";
import { HouseholdModel } from "../../households/models/household.model";
import { MembershipModel } from "../../households/models/membership.model";
import { ExpenseModel } from "../../expenses/models/expense.model";
import { AbsenceModel } from "../models/absence.model";
import {
  RealtimeEventType,
  type JsonValue,
  type RealtimePublisher,
} from "@realtime/contracts";

const id = (prefix: string) => `${prefix}_${randomUUID()}`;
const plain = <T>(doc: unknown): T => doc as T;
const DAY_MS = 24 * 60 * 60 * 1000;

type DateRange = { start: Date; end: Date };

export class AbsenceService {
  constructor(
    private readonly now = () => new Date(),
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async createAbsence(
    householdId: string,
    actorUserId: string,
    input: {
      membershipId: string;
      periodStart: string;
      periodEnd: string;
      reason?: string | undefined;
      createdByMembershipId: string;
    },
  ) {
    if (!(await HouseholdModel.findById(householdId).lean())) throw notFound("household");
    const membership = await this.findActiveMembership(householdId, input.membershipId);
    if (!membership) throw notFound("membership");
    const actor = await this.findActiveMembershipByUser(householdId, actorUserId);
    if (!actor) throw forbidden("an active membership is required");
    if (actor.id !== input.createdByMembershipId) {
      throw forbidden("createdByMembershipId must match the authenticated membership");
    }
    this.assertCanManageAbsence(actor, input.membershipId);
    const periodStart = parseDate(input.periodStart, "periodStart");
    const periodEnd = parseDate(input.periodEnd, "periodEnd");
    if (periodStart >= periodEnd) throw badRequest("INVALID_PERIOD", "periodStart must be before periodEnd");
    if (await this.findOverlappingActiveAbsence(householdId, input.membershipId, periodStart, periodEnd)) {
      throw badRequest("OVERLAPPING_ABSENCE", "absence period overlaps an active absence");
    }
    const absence: Absence = {
      id: id("abs"),
      householdId,
      membershipId: input.membershipId,
      periodStart,
      periodEnd,
      ...(input.reason ? { reason: input.reason.trim() } : {}),
      status: "ACTIVE",
      createdByMembershipId: actor.id,
      createdAt: this.now(),
    };
    await AbsenceModel.create({ ...absence, _id: absence.id });
    await this.publishChange(householdId, RealtimeEventType.AbsenceCreated, {
      absenceId: absence.id,
      membershipId: absence.membershipId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      ...(input.reason ? { reason: input.reason.trim() } : {}),
    } as JsonValue);
    return absence;
  }

  async cancelAbsence(
    householdId: string,
    absenceId: string,
    actorUserId: string,
    input: { cancelledByMembershipId: string },
  ) {
    const absence = plain<Absence | null>(await AbsenceModel.findById(absenceId).lean());
    if (!absence || absence.householdId !== householdId) throw notFound("absence");
    if (absence.status !== "ACTIVE") {
      throw badRequest("ABSENCE_ALREADY_CANCELLED", "absence has already been cancelled");
    }
    const actor = await this.findActiveMembershipByUser(householdId, actorUserId);
    if (!actor) throw forbidden("an active membership is required");
    if (actor.id !== input.cancelledByMembershipId) {
      throw forbidden("cancelledByMembershipId must match the authenticated membership");
    }
    this.assertCanManageAbsence(actor, absence.membershipId);
    absence.status = "CANCELLED";
    absence.cancelledByMembershipId = actor.id;
    absence.cancelledAt = this.now();
    await AbsenceModel.replaceOne({ _id: absence.id }, { ...absence, _id: absence.id });
    await this.publishChange(householdId, RealtimeEventType.AbsenceCancelled, {
      absenceId: absence.id,
      membershipId: absence.membershipId,
      periodStart: absence.periodStart.toISOString(),
      periodEnd: absence.periodEnd.toISOString(),
    } as JsonValue);
    return absence;
  }

  async listAbsences(householdId: string, userId: string, input: { from: string; to: string }) {
    if (!(await HouseholdModel.findById(householdId).lean())) throw notFound("household");
    if (!(await this.findActiveMembershipByUser(householdId, userId))) {
      throw forbidden("an active membership is required");
    }
    const from = parseDate(input.from, "from");
    const to = parseDate(input.to, "to");
    if (from >= to) throw badRequest("INVALID_PERIOD", "from must be before to");
    return plain<Absence[]>(
      await AbsenceModel.find({
        householdId,
        periodStart: { $lt: to },
        periodEnd: { $gt: from },
      })
        .sort({ periodStart: 1, _id: 1 })
        .lean(),
    );
  }

  async monthlySettlement(householdId: string, userId: string, input: { month: string }): Promise<MonthlySettlement> {
    if (!(await HouseholdModel.findById(householdId).lean())) throw notFound("household");
    if (!(await this.findActiveMembershipByUser(householdId, userId))) {
      throw forbidden("an active membership is required");
    }
    const monthRange = this.parseMonthRange(input.month);
    const [expenses, memberships, absences] = await Promise.all([
      plain<Array<{ totalAmount: number }>>(
        await ExpenseModel.find({
          householdId,
          status: "ACTIVE",
          date: { $gte: monthRange.start, $lt: monthRange.end },
        }).lean(),
      ),
      plain<
        Array<{
          id: string;
          joinedAt: Date;
          livingSince?: Date | null;
          leftAt?: Date | null;
          status: "ACTIVE" | "INACTIVE";
        }>
      >(await MembershipModel.find({ householdId }).lean()),
      plain<Absence[]>(
        await AbsenceModel.find({
          householdId,
          status: "ACTIVE",
          periodStart: { $lt: monthRange.end },
          periodEnd: { $gt: monthRange.start },
        }).lean(),
      ),
    ]);

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
    const daysInMonth = this.countDays(monthRange);
    const absencesByMembership = new Map<string, DateRange[]>();
    for (const absence of absences) {
      const current = absencesByMembership.get(absence.membershipId) ?? [];
      current.push({ start: absence.periodStart, end: absence.periodEnd });
      absencesByMembership.set(absence.membershipId, current);
    }

    const members = memberships
      .map((membership) => {
        const activeRange = this.getMembershipMonthRange(membership, monthRange);
        if (!activeRange) return null;
        const memberDays = this.countDays(activeRange);
        if (memberDays <= 0) return null;
        const absenceDays = (absencesByMembership.get(membership.id) ?? []).reduce((sum, absence) => {
          const overlap = this.intersectRanges(activeRange, absence);
          return sum + (overlap ? this.countDays(overlap) : 0);
        }, 0);
        const presenceDays = Math.max(memberDays - absenceDays, 0);
        return {
          membershipId: membership.id,
          memberDays,
          absenceDays,
          presenceDays,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const totalMemberDays = members.reduce((sum, member) => sum + member.memberDays, 0);
    const totalAbsenceDays = members.reduce((sum, member) => sum + member.absenceDays, 0);
    const totalPresenceDays = members.reduce((sum, member) => sum + member.presenceDays, 0);

    if (totalAmount > 0 && totalPresenceDays <= 0) {
      throw badRequest("NO_ELIGIBLE_MEMBERS", "at least one member must have presence days in the month");
    }

    const assignedAmounts =
      totalAmount > 0 && members.some((member) => member.presenceDays > 0)
        ? calculateWeightedSplit(
            totalAmount,
            members
              .filter((member) => member.presenceDays > 0)
              .map((member) => ({ membershipId: member.membershipId, weight: member.presenceDays })),
          )
        : [];
    const assignedByMembership = new Map(assignedAmounts.map((item) => [item.membershipId, item.assignedAmount]));

    return {
      householdId,
      month: input.month,
      totalAmount,
      daysInMonth,
      totalMemberDays,
      totalAbsenceDays,
      totalPresenceDays,
      dailyAmount: totalAmount / daysInMonth,
      members: members
        .map((member) => ({
          ...member,
          assignedAmount: assignedByMembership.get(member.membershipId) ?? 0,
        }))
        .sort((a, b) => a.membershipId.localeCompare(b.membershipId)),
    };
  }

  private parseMonthRange(month: string): DateRange {
    const [yearPart, monthPart] = month.split("-");
    const year = Number(yearPart);
    const monthNumber = Number(monthPart);
    if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      throw badRequest("INVALID_MONTH", "month must use YYYY-MM");
    }
    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 1));
    return { start, end };
  }

  private getMembershipMonthRange(
    membership: { joinedAt: Date; livingSince?: Date | null; leftAt?: Date | null },
    monthRange: DateRange,
  ): DateRange | null {
    const start = this.maxDate(effectiveMembershipStart(membership), monthRange.start);
    const end = this.minDate(membership.leftAt ?? monthRange.end, monthRange.end);
    if (end <= start) return null;
    return { start, end };
  }

  private intersectRanges(first: DateRange, second: DateRange): DateRange | null {
    const start = this.maxDate(first.start, second.start);
    const end = this.minDate(first.end, second.end);
    if (end <= start) return null;
    return { start, end };
  }

  private countDays(range: DateRange): number {
    return Math.max(0, Math.floor((range.end.getTime() - range.start.getTime()) / DAY_MS));
  }

  private maxDate(first: Date, second: Date) {
    return first.getTime() >= second.getTime() ? first : second;
  }

  private minDate(first: Date, second: Date) {
    return first.getTime() <= second.getTime() ? first : second;
  }

  private async findActiveMembership(householdId: string, membershipId: string, date = this.now()) {
    return plain<{ id: string; role: "ADMIN" | "MEMBER" } | null>(
      await MembershipModel.findOne({
        _id: membershipId,
        householdId,
        ...activeMembershipCriteria(date),
      }).lean(),
    );
  }

  private async findActiveMembershipByUser(householdId: string, userId: string, date = this.now()) {
    return plain<{ id: string; role: "ADMIN" | "MEMBER" } | null>(
      await MembershipModel.findOne({
        householdId,
        userId,
        ...activeMembershipCriteria(date),
      }).lean(),
    );
  }

  private async findOverlappingActiveAbsence(
    householdId: string,
    membershipId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    return plain<Absence | null>(
      await AbsenceModel.findOne({
        householdId,
        membershipId,
        status: "ACTIVE",
        periodStart: { $lt: periodEnd },
        periodEnd: { $gt: periodStart },
      }).lean(),
    );
  }

  private assertCanManageAbsence(actor: { id: string; role: "ADMIN" | "MEMBER" }, membershipId: string) {
    if (actor.id === membershipId) return;
    if (actor.role === "ADMIN") return;
    throw forbidden("only an ADMIN can manage another member absence");
  }

  private async publishChange(householdId: string, type: string, payload: JsonValue) {
    if (!this.realtimePublisher) return;
    await this.realtimePublisher.publish({
      id: `${type}:${householdId}:${Date.now()}`,
      type,
      householdId,
      occurredAt: this.now().toISOString(),
      version: 1,
      payload,
    });
  }
}
