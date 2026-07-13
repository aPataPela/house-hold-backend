import { requestJson } from "../core/http-client";
import { RepositoryCache, cacheKey } from "../core/cache";
import { DataAccessError } from "../core/errors";
import {
  addDays,
  compareDates,
  daysBetweenInclusive,
  monthRange,
  normalizeDate,
  normalizeMonth,
  normalizeMoney,
} from "../core/normalize";
import type { RequestContext } from "../core/types";
import {
  createFakeDataStore,
  createFakeId,
  type FakeDataStore,
  type FakeDataStoreSeed,
} from "../core/fake-store";
import type {
  Absence,
  CancelAbsenceCommand,
  CreateAbsenceCommand,
  MonthlySettlement,
  MonthlySettlementMember,
} from "../models";

export interface AbsenceDto {
  absenceId: string;
  membershipId: string;
  status: Absence["status"];
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

export interface AbsenceListResponseDto {
  absences: AbsenceDto[];
}

export interface CreateAbsenceRequestDto {
  membershipId: string;
  periodStart: string;
  periodEnd: string;
  reason?: string;
  createdByMembershipId: string;
}

export interface CancelAbsenceRequestDto {
  cancelledByMembershipId: string;
}

export interface MonthlySettlementResponseDto {
  householdId: string;
  month: string;
  totalAmount: number;
  daysInMonth: number;
  totalMemberDays: number;
  totalAbsenceDays: number;
  totalPresenceDays: number;
  dailyAmount: number;
  members: MonthlySettlementMember[];
}

export interface AbsenceListQuery {
  from: string | Date;
  to: string | Date;
}

export interface AbsencesRepository {
  list(householdId: string, query: AbsenceListQuery, context?: RequestContext): Promise<Absence[]>;
  create(
    householdId: string,
    command: CreateAbsenceCommand,
    context?: RequestContext,
  ): Promise<Absence>;
  cancel(
    householdId: string,
    absenceId: string,
    command: CancelAbsenceCommand,
    context?: RequestContext,
  ): Promise<Absence>;
  monthlySettlement(
    householdId: string,
    month: string | Date,
    context?: RequestContext,
  ): Promise<MonthlySettlement>;
}

export function mapAbsenceDtoToAbsence(dto: AbsenceDto, householdId = ""): Absence {
  return {
    absenceId: dto.absenceId,
    householdId,
    membershipId: dto.membershipId,
    status: dto.status,
    periodStart: normalizeDate(dto.periodStart),
    periodEnd: normalizeDate(dto.periodEnd),
    reason: dto.reason,
    audit: {
      createdByMembershipId: dto.audit.createdByMembershipId,
      createdAt: normalizeDateTime(dto.audit.createdAt),
      ...(dto.audit.cancelledByMembershipId
        ? { cancelledByMembershipId: dto.audit.cancelledByMembershipId }
        : {}),
      ...(dto.audit.cancelledAt ? { cancelledAt: normalizeDateTime(dto.audit.cancelledAt) } : {}),
    },
  };
}

export function mapAbsenceToDto(absence: Absence): AbsenceDto {
  return {
    absenceId: absence.absenceId,
    membershipId: absence.membershipId,
    status: absence.status,
    periodStart: normalizeDate(absence.periodStart),
    periodEnd: normalizeDate(absence.periodEnd),
    reason: absence.reason,
    audit: {
      createdByMembershipId: absence.audit.createdByMembershipId,
      createdAt: absence.audit.createdAt,
      ...(absence.audit.cancelledByMembershipId
        ? { cancelledByMembershipId: absence.audit.cancelledByMembershipId }
        : {}),
      ...(absence.audit.cancelledAt ? { cancelledAt: absence.audit.cancelledAt } : {}),
    },
  };
}

export function mapCreateAbsenceCommandToDto(command: CreateAbsenceCommand): CreateAbsenceRequestDto {
  return {
    membershipId: command.membershipId,
    periodStart: normalizeDate(command.periodStart),
    periodEnd: normalizeDate(command.periodEnd),
    ...(command.reason ? { reason: command.reason } : {}),
    createdByMembershipId: command.createdByMembershipId,
  };
}

export function mapCancelAbsenceCommandToDto(command: CancelAbsenceCommand): CancelAbsenceRequestDto {
  return { cancelledByMembershipId: command.cancelledByMembershipId };
}

export function mapMonthlySettlementDtoToDomain(dto: MonthlySettlementResponseDto): MonthlySettlement {
  return {
    householdId: dto.householdId,
    month: normalizeMonth(dto.month),
    totalAmount: normalizeMoney(dto.totalAmount),
    daysInMonth: dto.daysInMonth,
    totalMemberDays: dto.totalMemberDays,
    totalAbsenceDays: dto.totalAbsenceDays,
    totalPresenceDays: dto.totalPresenceDays,
    dailyAmount: normalizeMoney(dto.dailyAmount),
    members: dto.members.map((member) => ({
      membershipId: member.membershipId,
      memberDays: member.memberDays,
      absenceDays: member.absenceDays,
      presenceDays: member.presenceDays,
      assignedAmount: normalizeMoney(member.assignedAmount),
    })),
  };
}

export function createAbsencesHttpRepository(options: { ttlMs?: number } = {}): AbsencesRepository {
  const cache = new RepositoryCache<Absence[] | MonthlySettlement>({ ttlMs: options.ttlMs });

  return {
    async list(householdId, query, context) {
      const normalizedQuery = {
        from: normalizeDate(query.from),
        to: normalizeDate(query.to),
      };
      const key = cacheKey("absences:list", householdId, normalizedQuery.from, normalizedQuery.to);
      if (!context?.forceRefresh) {
        const cached = cache.get(key);
        if (cached) return (cached as Absence[]).map((absence) => ({ ...absence, audit: { ...absence.audit } }));
      }

      const response = await requestJson<AbsenceListResponseDto>(
        `/api/v1/households/${householdId}/absences?from=${normalizedQuery.from}&to=${normalizedQuery.to}`,
        {
          accessToken: context?.accessToken,
          signal: context?.signal,
        },
      );

      const absences = response.absences.map((absence) => mapAbsenceDtoToAbsence(absence, householdId));
      cache.set(key, absences);
      return absences.map((absence) => ({ ...absence, audit: { ...absence.audit } }));
    },

    async create(householdId, command, context) {
      const response = await requestJson<{ absence: AbsenceDto }>(
        `/api/v1/households/${householdId}/absences`,
        {
          method: "POST",
          body: JSON.stringify(mapCreateAbsenceCommandToDto(command)),
          accessToken: context?.accessToken,
          signal: context?.signal,
        },
      );

      cache.invalidatePrefix("absences:list:");
      cache.invalidatePrefix("presence:");
      cache.invalidatePrefix("tasks:week:");
      return mapAbsenceDtoToAbsence(response.absence, householdId);
    },

    async cancel(householdId, absenceId, command, context) {
      const response = await requestJson<{ absence: AbsenceDto }>(
        `/api/v1/households/${householdId}/absences/${absenceId}/cancel`,
        {
          method: "POST",
          body: JSON.stringify(mapCancelAbsenceCommandToDto(command)),
          accessToken: context?.accessToken,
          signal: context?.signal,
        },
      );

      cache.invalidatePrefix("absences:list:");
      cache.invalidatePrefix("presence:");
      cache.invalidatePrefix("tasks:week:");
      return mapAbsenceDtoToAbsence(response.absence, householdId);
    },

    async monthlySettlement(householdId, month, context) {
      const normalizedMonth = normalizeMonth(month);
      const key = cacheKey("absences:monthly-settlement", householdId, normalizedMonth);
      if (!context?.forceRefresh) {
        const cached = cache.get(key);
        if (cached) return { ...(cached as MonthlySettlement) };
      }

      const response = await requestJson<MonthlySettlementResponseDto>(
        `/api/v1/households/${householdId}/monthly-settlement?month=${normalizedMonth}`,
        {
          accessToken: context?.accessToken,
          signal: context?.signal,
        },
      );

      const settlement = mapMonthlySettlementDtoToDomain(response);
      cache.set(key, settlement);
      return { ...settlement, members: settlement.members.map((member) => ({ ...member })) };
    },
  };
}

export function createFakeAbsencesRepository(seed: FakeDataStoreSeed = {}): AbsencesRepository {
  const store = createFakeDataStore(seed);
  return createFakeAbsencesRepositoryFromStore(store);
}

export function createFakeAbsencesRepositoryFromStore(store: FakeDataStore): AbsencesRepository {
  return {
    async list(householdId, query) {
      const from = normalizeDate(query.from);
      const to = normalizeDate(query.to);
      return store.absences
        .filter(
          (absence) =>
            absence.householdId === householdId &&
            compareDates(absence.periodEnd, from) >= 0 &&
            compareDates(absence.periodStart, to) <= 0,
        )
        .map((absence) => ({ ...absence, audit: { ...absence.audit } }));
    },
    async create(householdId, command) {
      const now = new Date().toISOString();
      const absence: Absence = {
        absenceId: createFakeId(store, "absence", "absence"),
        householdId,
        membershipId: command.membershipId,
        status: "ACTIVE",
        periodStart: normalizeDate(command.periodStart),
        periodEnd: normalizeDate(command.periodEnd),
        reason: command.reason,
        audit: {
          createdByMembershipId: command.createdByMembershipId,
          createdAt: now,
        },
      };
      store.absences.push(absence);
      return { ...absence, audit: { ...absence.audit } };
    },
    async cancel(householdId, absenceId, command) {
      const current = store.absences.find((absence) => absence.householdId === householdId && absence.absenceId === absenceId);
      if (!current) {
        throw new DataAccessError("NOT_FOUND", "Absence not found.");
      }
      current.status = "CANCELLED";
      current.audit.cancelledByMembershipId = command.cancelledByMembershipId;
      current.audit.cancelledAt = new Date().toISOString();
      return { ...current, audit: { ...current.audit } };
    },
    async monthlySettlement(householdId, month) {
      const normalizedMonth = normalizeMonth(month);
      const range = monthRange(normalizedMonth);
      const members = store.members.filter(
        (member) =>
          member.householdId === householdId &&
          member.status === "ACTIVE" &&
          compareDates(member.livingSince, range.to) <= 0,
      );
      const activeAbsences = store.absences.filter(
        (absence) =>
          absence.householdId === householdId &&
          absence.status === "ACTIVE" &&
          compareDates(absence.periodEnd, range.from) >= 0 &&
          compareDates(absence.periodStart, range.to) <= 0,
      );
      const daysInMonth = daysBetweenInclusive(range.from, addDays(range.to, -1));
      const rows = members.map((member) => {
        const memberStart = compareDates(member.livingSince, range.from) > 0 ? member.livingSince : range.from;
        const memberDays = compareDates(memberStart, addDays(range.to, -1)) <= 0 ? daysBetweenInclusive(memberStart, addDays(range.to, -1)) : 0;
        const absenceDays = activeAbsences
          .filter((absence) => absence.membershipId === member.membershipId)
          .reduce((sum, absence) => {
            const absenceStart = compareDates(absence.periodStart, memberStart) > 0 ? absence.periodStart : memberStart;
            const absenceEnd = compareDates(absence.periodEnd, addDays(range.to, -1)) < 0 ? absence.periodEnd : addDays(range.to, -1);
            return compareDates(absenceStart, absenceEnd) <= 0 ? sum + daysBetweenInclusive(absenceStart, absenceEnd) : sum;
          }, 0);
        const presenceDays = Math.max(memberDays - absenceDays, 0);
        return { membershipId: member.membershipId, memberDays, absenceDays, presenceDays, assignedAmount: 0 };
      });
      const totalMemberDays = rows.reduce((sum, row) => sum + row.memberDays, 0);
      const totalAbsenceDays = rows.reduce((sum, row) => sum + row.absenceDays, 0);
      const totalPresenceDays = rows.reduce((sum, row) => sum + row.presenceDays, 0);
      const totalAmount = normalizeMoney(store.monthlyTotals.get(normalizedMonth) ?? 0);
      const dailyAmount = totalPresenceDays > 0 ? Math.trunc(totalAmount / totalPresenceDays) : 0;
      let remaining = totalAmount;
      const enrichedRows = rows.map((row, index) => {
        if (index === rows.length - 1) {
          const assignedAmount = remaining;
          remaining = 0;
          return { ...row, assignedAmount };
        }
        const assignedAmount =
          totalPresenceDays > 0 ? Math.floor((totalAmount * row.presenceDays) / totalPresenceDays) : 0;
        remaining -= assignedAmount;
        return { ...row, assignedAmount };
      });
      return {
        householdId,
        month: normalizedMonth,
        totalAmount,
        daysInMonth,
        totalMemberDays,
        totalAbsenceDays,
        totalPresenceDays,
        dailyAmount,
        members: enrichedRows,
      };
    },
  };
}

function normalizeDateTime(value: string): string {
  return value.includes("T") ? value : `${normalizeDate(value)}T00:00:00.000Z`;
}
