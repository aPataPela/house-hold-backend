import { describe, expect, it, vi } from "vitest";
import { AbsenceApplicationError, createAbsenceUseCase, createCancelAbsenceUseCase } from "./index";
import type { AbsenceRecord, MonthlySettlementSummary } from "../domain";

const members = [
  {
    membershipId: "m1",
    householdId: "h1",
    displayName: "Ana",
    role: "MEMBER" as const,
    livingSince: "2026-01-01",
    status: "ACTIVE" as const,
  },
  {
    membershipId: "m2",
    householdId: "h1",
    displayName: "Bea",
    role: "ADMIN" as const,
    livingSince: "2026-01-01",
    status: "ACTIVE" as const,
  },
];

const settlement: MonthlySettlementSummary = {
  householdId: "h1",
  month: "2026-07",
  totalAmount: 300000,
  daysInMonth: 31,
  totalMemberDays: 62,
  totalAbsenceDays: 0,
  totalPresenceDays: 62,
  dailyAmount: 4838,
  members: [
    { membershipId: "m1", memberDays: 31, absenceDays: 0, presenceDays: 31, assignedAmount: 150000 },
    { membershipId: "m2", memberDays: 31, absenceDays: 0, presenceDays: 31, assignedAmount: 150000 },
  ],
};

describe("absence use cases", () => {
  it("creates a self absence", async () => {
    const execute = createAbsenceUseCase({
      createAbsence: vi.fn(async (draft): Promise<AbsenceRecord> => ({
        absenceId: "a1",
        householdId: "h1",
        membershipId: draft.membershipId,
        status: "ACTIVE",
        periodStart: draft.periodStart,
        periodEnd: draft.periodEnd,
        reason: draft.reason,
        audit: { createdByMembershipId: draft.createdByMembershipId, createdAt: "2026-07-01T00:00:00.000Z" },
      })),
    });

    const result = await execute({
      actor: { membershipId: "m1", role: "MEMBER" },
      draft: {
        membershipId: "m1",
        periodStart: "2026-07-10",
        periodEnd: "2026-07-12",
        createdByMembershipId: "m1",
      },
      members,
      absences: [],
      settlement,
      week: null,
    });

    expect(result.absence.membershipId).toBe("m1");
  });

  it("rejects overlaps before calling the repository", async () => {
    const createAbsence = vi.fn();
    const execute = createAbsenceUseCase({ createAbsence });

    await expect(
      execute({
        actor: { membershipId: "m1", role: "ADMIN" },
        draft: {
          membershipId: "m1",
          periodStart: "2026-07-10",
          periodEnd: "2026-07-12",
          createdByMembershipId: "m1",
        },
        members,
      absences: [
        {
          absenceId: "a1",
          householdId: "h1",
            membershipId: "m1",
            status: "ACTIVE",
            periodStart: "2026-07-11",
            periodEnd: "2026-07-13",
            audit: { createdByMembershipId: "m1", createdAt: "2026-07-01T00:00:00.000Z" },
          },
        ] as AbsenceRecord[],
        settlement,
        week: null,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(createAbsence).not.toHaveBeenCalled();
  });

  it("rejects canceling another member without permission", async () => {
    const execute = createCancelAbsenceUseCase({
      cancelAbsence: vi.fn(),
    });

    await expect(
      execute({
        actor: { membershipId: "m1", role: "MEMBER" },
        absenceId: "a1",
        absences: [
          {
            absenceId: "a1",
            householdId: "h1",
            membershipId: "m2",
            status: "ACTIVE",
            periodStart: "2026-07-11",
            periodEnd: "2026-07-13",
            audit: { createdByMembershipId: "m2", createdAt: "2026-07-01T00:00:00.000Z" },
          },
        ] as AbsenceRecord[],
      }),
    ).rejects.toBeInstanceOf(AbsenceApplicationError);
  });
});
