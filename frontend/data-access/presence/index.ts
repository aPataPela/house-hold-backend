import { requestJson } from "../core/http-client";
import { RepositoryCache, cacheKey } from "../core/cache";
import {
  addDays,
  compareDates,
  daysBetweenInclusive,
  normalizeDate,
  normalizeMonth,
} from "../core/normalize";
import type { RequestContext } from "../core/types";
import {
  createFakeDataStore,
  type FakeDataStore,
  type FakeDataStoreSeed,
} from "../core/fake-store";
import type {
  Absence,
  Member,
  MonthlyPresenceSummary,
  PresencePeriod,
} from "../models";
import {
  mapMonthlySettlementDtoToDomain,
  type MonthlySettlementResponseDto,
  type AbsenceDto,
  type AbsenceListResponseDto,
} from "../absences";
import { mapMemberDtoToMember, type MembersListResponseDto } from "../members";
import { createFakeAbsencesRepositoryFromStore } from "../absences";
import { createFakeMembersRepositoryFromStore } from "../members";

export type PresenceMonthlySummaryDto = MonthlySettlementResponseDto;

export interface PresencePeriodDto {
  membershipId: string;
  periodStart: string;
  periodEnd: string;
  kind: PresencePeriod["kind"];
  days: number;
  absenceId?: string;
  reason?: string;
}

export interface PresenceRangeQuery {
  from: string | Date;
  to: string | Date;
}

export interface PresenceRepository {
  monthlySummary(
    householdId: string,
    month: string | Date,
    context?: RequestContext,
  ): Promise<MonthlyPresenceSummary>;
  listPeriods(
    householdId: string,
    query: PresenceRangeQuery,
    context?: RequestContext,
  ): Promise<PresencePeriod[]>;
}

export function mapPresenceMonthlySummaryDtoToDomain(
  dto: PresenceMonthlySummaryDto,
): MonthlyPresenceSummary {
  const settlement = mapMonthlySettlementDtoToDomain(dto);
  return {
    householdId: settlement.householdId,
    month: settlement.month,
    totalMemberDays: settlement.totalMemberDays,
    totalAbsenceDays: settlement.totalAbsenceDays,
    totalPresenceDays: settlement.totalPresenceDays,
    daysInMonth: settlement.daysInMonth,
    dailyAmount: settlement.dailyAmount,
    members: settlement.members,
  };
}

export function mapPresencePeriodDtoToDomain(dto: PresencePeriodDto): PresencePeriod {
  return {
    membershipId: dto.membershipId,
    periodStart: normalizeDate(dto.periodStart),
    periodEnd: normalizeDate(dto.periodEnd),
    kind: dto.kind,
    days: dto.days,
    ...(dto.absenceId ? { absenceId: dto.absenceId } : {}),
    ...(dto.reason ? { reason: dto.reason } : {}),
  };
}

export function createPresenceHttpRepository(options: { ttlMs?: number } = {}): PresenceRepository {
  const cache = new RepositoryCache<MonthlyPresenceSummary | PresencePeriod[]>({ ttlMs: options.ttlMs });

  return {
    async monthlySummary(householdId, month, context) {
      const normalizedMonth = normalizeMonth(month);
      const key = cacheKey("presence:monthly-summary", householdId, normalizedMonth);
      if (!context?.forceRefresh) {
        const cached = cache.get(key);
        if (cached) return { ...(cached as MonthlyPresenceSummary), members: (cached as MonthlyPresenceSummary).members.map((row) => ({ ...row })) };
      }

      const response = await requestJson<PresenceMonthlySummaryDto>(
        `/api/v1/households/${householdId}/monthly-settlement?month=${normalizedMonth}`,
        {
          accessToken: context?.accessToken,
          signal: context?.signal,
        },
      );

      const summary = mapPresenceMonthlySummaryDtoToDomain(response);
      cache.set(key, summary);
      return { ...summary, members: summary.members.map((row) => ({ ...row })) };
    },

    async listPeriods(householdId, query, context) {
      const normalizedQuery = {
        from: normalizeDate(query.from),
        to: normalizeDate(query.to),
      };
      const key = cacheKey("presence:periods", householdId, normalizedQuery.from, normalizedQuery.to);
      if (!context?.forceRefresh) {
        const cached = cache.get(key);
        if (cached) return (cached as PresencePeriod[]).map((period) => ({ ...period }));
      }

      const [membersResponse, absencesResponse] = await Promise.all([
        requestJson<MembersListResponseDto>(`/api/v1/households/${householdId}/memberships`, {
          accessToken: context?.accessToken,
          signal: context?.signal,
        }),
        requestJson<AbsenceListResponseDto>(
          `/api/v1/households/${householdId}/absences?from=${normalizedQuery.from}&to=${normalizedQuery.to}`,
          {
            accessToken: context?.accessToken,
            signal: context?.signal,
          },
        ),
      ]);

      const members = membersResponse.memberships.map(mapMemberDtoToMember);
      const absences = absencesResponse.absences.map((absence) => mapAbsenceDtoToDomainAbsence(absence, householdId));
      const periods = derivePresencePeriods(members, absences, normalizedQuery.from, normalizedQuery.to);
      cache.set(key, periods);
      return periods.map((period) => ({ ...period }));
    },
  };
}

export function createFakePresenceRepository(seed: FakeDataStoreSeed = {}): PresenceRepository {
  const store = createFakeDataStore(seed);
  return createFakePresenceRepositoryFromStore(store);
}

export function createFakePresenceRepositoryFromStore(store: FakeDataStore): PresenceRepository {
  const absencesRepo = createFakeAbsencesRepositoryFromStore(store);
  const membersRepo = createFakeMembersRepositoryFromStore(store);

  return {
    async monthlySummary(householdId, month) {
      return absencesRepo.monthlySettlement(householdId, month);
    },
    async listPeriods(householdId, query) {
      const [members, absences] = await Promise.all([
        membersRepo.list(householdId),
        absencesRepo.list(householdId, query),
      ]);
      return derivePresencePeriods(members, absences, normalizeDate(query.from), normalizeDate(query.to));
    },
  };
}

function mapAbsenceDtoToDomainAbsence(dto: AbsenceDto, householdId: string): Absence {
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
      createdAt: dto.audit.createdAt,
      ...(dto.audit.cancelledByMembershipId
        ? { cancelledByMembershipId: dto.audit.cancelledByMembershipId }
        : {}),
      ...(dto.audit.cancelledAt ? { cancelledAt: dto.audit.cancelledAt } : {}),
    },
  };
}

function derivePresencePeriods(
  members: Member[],
  absences: Absence[],
  from: string,
  to: string,
): PresencePeriod[] {
  const periods: PresencePeriod[] = [];

  for (const member of members) {
    if (member.status !== "ACTIVE") {
      continue;
    }

    const activeStart = compareDates(member.livingSince, from) > 0 ? member.livingSince : from;
    const activeEnd = compareDates(member.livingSince, to) > 0 ? from : to;
    if (compareDates(activeStart, activeEnd) > 0) {
      continue;
    }

    const memberAbsences = absences
      .filter(
        (absence) =>
          absence.membershipId === member.membershipId &&
          absence.status === "ACTIVE" &&
          compareDates(absence.periodEnd, activeStart) >= 0 &&
          compareDates(absence.periodStart, activeEnd) <= 0,
      )
      .sort((a, b) => compareDates(a.periodStart, b.periodStart));

    let cursor = activeStart;
    for (const absence of memberAbsences) {
      const absenceStart = compareDates(absence.periodStart, cursor) > 0 ? absence.periodStart : cursor;
      const absenceEnd = compareDates(absence.periodEnd, activeEnd) < 0 ? absence.periodEnd : activeEnd;
      if (compareDates(cursor, addDays(absenceStart, -1)) <= 0) {
        const presentEnd = addDays(absenceStart, -1);
        periods.push({
          membershipId: member.membershipId,
          periodStart: cursor,
          periodEnd: presentEnd,
          kind: "PRESENT",
          days: daysBetweenInclusive(cursor, presentEnd),
        });
      }
      if (compareDates(absenceStart, absenceEnd) <= 0) {
        periods.push({
          membershipId: member.membershipId,
          periodStart: absenceStart,
          periodEnd: absenceEnd,
          kind: "ABSENT",
          days: daysBetweenInclusive(absenceStart, absenceEnd),
          absenceId: absence.absenceId,
          reason: absence.reason,
        });
      }
      cursor = addDays(absenceEnd, 1);
      if (compareDates(cursor, activeEnd) > 0) {
        break;
      }
    }

    if (compareDates(cursor, activeEnd) <= 0) {
      periods.push({
        membershipId: member.membershipId,
        periodStart: cursor,
        periodEnd: activeEnd,
        kind: "PRESENT",
        days: daysBetweenInclusive(cursor, activeEnd),
      });
    }
  }

  return periods.sort((a, b) => {
    const byMember = a.membershipId.localeCompare(b.membershipId);
    if (byMember !== 0) return byMember;
    return compareDates(a.periodStart, b.periodStart);
  });
}
