"use client";

import { useMemo, useState } from "react";
import { Toast } from "@/design-system";
import { ThemeProvider } from "@/design-system/theme";
import { AbsencesPage } from "@/features/absences";
import type {
  Absence,
  AbsenceDraft,
  ChoreWeek,
  Member,
  MonthlySettlement,
} from "@/lib/domain";

type Scenario = "happy" | "admin" | "conflict" | "no-permission";

export default function AbsencesDemoClient({ scenario }: { scenario: string }) {
  const selectedScenario = (scenario as Scenario) ?? "happy";

  const [members] = useState<Member[]>([
    {
      membershipId: "member-1",
      householdId: "house-1",
      userId: "ana",
      userName: "Ana",
      role: "MEMBER",
      joinedAt: "2026-01-01",
      livingSince: "2026-01-01",
    },
    {
      membershipId: "member-2",
      householdId: "house-1",
      userId: "bea",
      userName: "Bea",
      role: "ADMIN",
      joinedAt: "2026-01-01",
      livingSince: "2026-01-01",
    },
    {
      membershipId: "member-3",
      householdId: "house-1",
      userId: "carla",
      userName: "Carla",
      role: "MEMBER",
      joinedAt: "2026-01-01",
      livingSince: "2026-01-01",
    },
  ]);

  const [absences, setAbsences] = useState<Absence[]>(
    selectedScenario === "happy"
      ? [
          {
            absenceId: "abs-1",
            membershipId: "member-1",
            status: "ACTIVE",
            periodStart: "2026-07-10",
            periodEnd: "2026-07-12",
            reason: "Vacaciones",
            audit: {
              createdByMembershipId: "member-1",
              createdAt: "2026-07-01T10:00:00.000Z",
            },
          },
        ]
      : [
          {
            absenceId: "abs-1",
            membershipId: selectedScenario === "no-permission" ? "member-2" : "member-1",
            status: "ACTIVE",
            periodStart: "2026-07-20",
            periodEnd: "2026-07-22",
            reason: "Viaje corto",
            audit: {
              createdByMembershipId: "member-2",
              createdAt: "2026-07-01T10:00:00.000Z",
            },
          },
        ],
  );

  const [settlement] = useState<MonthlySettlement>({
    householdId: "house-1",
    month: "2026-07",
    totalAmount: 300000,
    daysInMonth: 31,
    totalMemberDays: 93,
    totalAbsenceDays: 0,
    totalPresenceDays: 93,
    dailyAmount: 3225,
    members: members.map((member, index) => ({
      membershipId: member.membershipId,
      memberDays: 31,
      absenceDays: 0,
      presenceDays: 31,
      assignedAmount: index === 2 ? 100002 : 99999,
    })),
  });

  const [week] = useState<ChoreWeek>({
    choreWeekId: "week-1",
    weekStart: "2026-07-20",
    weekEnd: "2026-07-26",
    tasks: [
      {
        choreTaskId: "task-1",
        commonAreaId: "area-1",
        name: "Lavar platos",
        priority: 1,
        assigneeLimit: 2,
        weeklyStatus: "PENDING",
        assignments: [
          { assignmentId: "asg-1", membershipId: "member-1", status: "PENDING" },
          { assignmentId: "asg-2", membershipId: "member-2", status: "PENDING" },
        ],
      },
    ],
  });

  const [loading, setLoading] = useState(false);

  const currentMembershipId = selectedScenario === "admin" ? "member-2" : "member-1";
  const currentRole = selectedScenario === "admin" ? "ADMIN" : "MEMBER";
  const canManageHouse = currentRole === "ADMIN";

  const memberName = useMemo(
    () => (id: string) => members.find((member) => member.membershipId === id)?.userName ?? id,
    [members],
  );

  const onCreateAbsence = async (draft: AbsenceDraft) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 120));
    setLoading(false);

    if (selectedScenario === "no-permission" && draft.membershipId !== currentMembershipId) {
      return false;
    }

    const overlap = absences.some(
      (absence) =>
        absence.membershipId === draft.membershipId &&
        absence.status === "ACTIVE" &&
        absence.periodStart <= draft.periodEnd &&
        absence.periodEnd >= draft.periodStart,
    );
    if (overlap) {
      return false;
    }

    setAbsences((current) => [
      {
        absenceId: `abs-${current.length + 1}`,
        membershipId: draft.membershipId,
        status: "ACTIVE",
        periodStart: draft.periodStart,
        periodEnd: draft.periodEnd,
        reason: draft.reason,
        audit: {
          createdByMembershipId: currentMembershipId,
          createdAt: new Date().toISOString(),
        },
      },
      ...current,
    ]);
    return true;
  };

  const onCancelAbsence = async (absenceId: string) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 120));
    setLoading(false);

    const target = absences.find((absence) => absence.absenceId === absenceId);
    if (!target) return false;
    if (selectedScenario === "no-permission" && target.membershipId !== currentMembershipId) {
      return false;
    }

    setAbsences((current) =>
      current.map((absence) =>
        absence.absenceId === absenceId
          ? {
              ...absence,
              status: "CANCELLED",
              audit: {
                ...absence.audit,
                cancelledByMembershipId: currentMembershipId,
                cancelledAt: new Date().toISOString(),
              },
            }
          : absence,
      ),
    );
    return true;
  };

  return (
    <ThemeProvider
      houseThemeId={selectedScenario === "admin" ? "cordillera" : "patagonia"}
      reducedTransparency={selectedScenario === "no-permission"}
    >
      <main data-testid="absences-demo-root" style={{ padding: "24px", maxWidth: 1160, margin: "0 auto" }}>
        {selectedScenario === "happy" ? (
          <Toast
            tone="success"
            title="Ausencia guardada"
            description="Se actualizó el impacto en presencia, liquidación y tareas."
          />
        ) : null}
        {selectedScenario === "conflict" ? (
          <Toast
            tone="danger"
            title="Conflicto de fechas"
            description="La ausencia nueva se superpone con una ausencia activa."
          />
        ) : null}
        <AbsencesPage
          members={members}
          absences={absences}
          settlement={settlement}
          week={week}
          selectedMonth="2026-07"
          currentMembershipId={currentMembershipId}
          currentRole={currentRole}
          canManageHouse={canManageHouse}
          loading={loading}
          onMonthChange={() => undefined}
          onCreateAbsence={onCreateAbsence}
          onCancelAbsence={onCancelAbsence}
          memberName={memberName}
        />
      </main>
    </ThemeProvider>
  );
}
