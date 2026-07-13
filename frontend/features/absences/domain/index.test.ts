import { describe, expect, it } from "vitest";
import {
  calculateAbsenceImpact,
  calculateProjectedSettlement,
  createAbsencePermissionPolicy,
  findAbsenceConflicts,
} from "./index";

describe("absence domain policies", () => {
  it("allows self-management for members and admins", () => {
    expect(createAbsencePermissionPolicy({ membershipId: "m1", role: "MEMBER" })).toMatchObject({
      canCreateForSelf: true,
      canCancelOwn: true,
      canCreateForOthers: false,
    });
    expect(createAbsencePermissionPolicy({ membershipId: "m2", role: "ADMIN" })).toMatchObject({
      canCreateForSelf: true,
      canCreateForOthers: true,
      canCancelOwn: true,
      canCancelOthers: true,
    });
  });

  it("detects overlaps for the same active membership", () => {
    const conflicts = findAbsenceConflicts(
      {
        membershipId: "m1",
        periodStart: "2026-07-10",
        periodEnd: "2026-07-14",
      },
      [
        {
          absenceId: "a1",
          householdId: "h1",
          membershipId: "m1",
          status: "ACTIVE",
          periodStart: "2026-07-12",
          periodEnd: "2026-07-15",
          audit: { createdByMembershipId: "m1", createdAt: "2026-07-01T00:00:00.000Z" },
        },
      ],
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ overlapDays: 3 });
  });

  it("projects settlement after a new absence", () => {
    const settlement = calculateProjectedSettlement(
      {
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
      },
      "m1",
      2,
    );

    expect(settlement?.totalPresenceDays).toBe(60);
    expect(settlement?.members[0].presenceDays).toBe(29);
  });

  it("calculates task impact from the current week", () => {
    const impact = calculateAbsenceImpact({
      members: [
        {
          membershipId: "m1",
          householdId: "h1",
          displayName: "Ana",
          role: "MEMBER",
          livingSince: "2026-01-01",
          status: "ACTIVE",
        },
      ],
      settlement: {
        householdId: "h1",
        month: "2026-07",
        totalAmount: 300000,
        daysInMonth: 31,
        totalMemberDays: 31,
        totalAbsenceDays: 0,
        totalPresenceDays: 31,
        dailyAmount: 9677,
        members: [{ membershipId: "m1", memberDays: 31, absenceDays: 0, presenceDays: 31, assignedAmount: 300000 }],
      },
      week: {
        weekId: "w1",
        householdId: "h1",
        weekStart: "2026-07-20",
        weekEnd: "2026-07-26",
        tasks: [
          {
            taskId: "t1",
            commonAreaId: "area-1",
            name: "Lavar platos",
            priority: 1,
            assigneeLimit: 1,
            weeklyStatus: "PENDING",
            assignments: [{ assignmentId: "a1", membershipId: "m1", status: "PENDING" }],
          },
        ],
      },
      draft: {
        membershipId: "m1",
        periodStart: "2026-07-20",
        periodEnd: "2026-07-21",
      },
    });

    expect(impact?.affectedTasks).toBe(1);
  });
});
