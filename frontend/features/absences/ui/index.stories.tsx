import type { Meta, StoryObj } from "@storybook/react-vite";
import { AbsencesPage, type AbsencesPageProps } from "./index";
import { ThemeStory, themeIds } from "@/design-system/stories/story-helpers";

const baseProps = (): AbsencesPageProps => ({
  members: [
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
  ],
  absences: [],
  settlement: {
    householdId: "house-1",
    month: "2026-07",
    totalAmount: 250000,
    daysInMonth: 31,
    totalMemberDays: 62,
    totalAbsenceDays: 0,
    totalPresenceDays: 62,
    dailyAmount: 4032,
    members: [
      { membershipId: "member-1", memberDays: 31, absenceDays: 0, presenceDays: 31, assignedAmount: 125000 },
      { membershipId: "member-2", memberDays: 31, absenceDays: 0, presenceDays: 31, assignedAmount: 125000 },
    ],
  },
  week: {
    choreWeekId: "week-1",
    weekStart: "2026-07-20",
    weekEnd: "2026-07-26",
    tasks: [
      {
        choreTaskId: "task-1",
        commonAreaId: "area-1",
        name: "Lavar platos",
        priority: 1,
        assigneeLimit: 1,
        weeklyStatus: "PENDING",
        assignments: [{ assignmentId: "asg-1", membershipId: "member-1", status: "PENDING" }],
      },
    ],
  },
  selectedMonth: "2026-07",
  currentMembershipId: "member-1",
  currentRole: "MEMBER",
  canManageHouse: false,
  loading: false,
  onRetry: () => undefined,
  onMonthChange: () => undefined,
  onCreateAbsence: async () => true,
  onCancelAbsence: async () => true,
  memberName: (id) => ({ "member-1": "Ana", "member-2": "Bea" }[id as "member-1" | "member-2"] ?? id),
});

const meta = {
  title: "Features/Absences",
  component: AbsencesPage,
  tags: ["autodocs"],
} satisfies Meta<typeof AbsencesPage>;

export default meta;

type Story = StoryObj<typeof AbsencesPage>;

export const Default: Story = {
  render: () => <AbsencesPage {...baseProps()} />,
};

export const AdminSelection: Story = {
  render: () => (
    <AbsencesPage
      {...baseProps()}
      currentMembershipId="member-2"
      currentRole="ADMIN"
      canManageHouse
      absences={[
        {
          absenceId: "a1",
          membershipId: "member-1",
          status: "ACTIVE",
          periodStart: "2026-07-10",
          periodEnd: "2026-07-12",
          reason: "Viaje",
          audit: { createdByMembershipId: "member-2", createdAt: "2026-07-01T00:00:00.000Z" },
        },
      ]}
    />
  ),
};

export const Conflict: Story = {
  render: () => (
    <AbsencesPage
      {...baseProps()}
      absences={[
        {
          absenceId: "a1",
          membershipId: "member-1",
          status: "ACTIVE",
          periodStart: "2026-07-10",
          periodEnd: "2026-07-12",
          reason: "Viaje",
          audit: { createdByMembershipId: "member-1", createdAt: "2026-07-01T00:00:00.000Z" },
        },
      ]}
    />
  ),
};

export const Loading: Story = {
  render: () => <AbsencesPage {...baseProps()} loading />,
};

export const ErrorState: Story = {
  render: () => <AbsencesPage {...baseProps()} error="No se pudieron cargar las ausencias." />,
};

export const Themes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {themeIds.map((themeId) => (
        <ThemeStory key={themeId} themeId={themeId}>
          <AbsencesPage {...baseProps()} />
        </ThemeStory>
      ))}
    </div>
  ),
};

export const ReducedTransparency: Story = {
  render: () => (
    <ThemeStory themeId="patagonia" reducedTransparency>
      <AbsencesPage {...baseProps()} />
    </ThemeStory>
  ),
};
