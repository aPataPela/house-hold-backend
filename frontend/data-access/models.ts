export type MemberRole = "ADMIN" | "MEMBER";
export type MemberStatus = "ACTIVE" | "INACTIVE";
export type AbsenceStatus = "ACTIVE" | "CANCELLED";
export type TaskStatus = "ACTIVE";
export type TaskAssignmentStatus = "PENDING" | "DONE" | "NOT_DONE";
export type MonthlyPresenceKind = "PRESENT" | "ABSENT";

export interface Member {
  membershipId: string;
  householdId: string;
  householdName?: string;
  userId: string;
  userName?: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  livingSince: string;
}

export interface InviteMemberCommand {
  userId: string;
  role: MemberRole;
  invitedByMembershipId: string;
  livingSince?: string | Date;
}

export interface InviteCodeResult {
  householdId: string;
  inviteCode: string;
}

export interface Absence {
  absenceId: string;
  householdId: string;
  membershipId: string;
  status: AbsenceStatus;
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

export interface CreateAbsenceCommand {
  membershipId: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  reason?: string;
  createdByMembershipId: string;
}

export interface CancelAbsenceCommand {
  cancelledByMembershipId: string;
}

export interface MonthlySettlementMember {
  membershipId: string;
  memberDays: number;
  absenceDays: number;
  presenceDays: number;
  assignedAmount: number;
}

export interface MonthlySettlement {
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

export interface PresencePeriod {
  membershipId: string;
  periodStart: string;
  periodEnd: string;
  kind: MonthlyPresenceKind;
  days: number;
  absenceId?: string;
  reason?: string;
}

export interface PresenceMonthSummary {
  householdId: string;
  month: string;
  totalMemberDays: number;
  totalAbsenceDays: number;
  totalPresenceDays: number;
  daysInMonth: number;
  dailyAmount: number;
  members: MonthlySettlementMember[];
}

export type MonthlyPresenceSummary = PresenceMonthSummary;

export interface CommonArea {
  commonAreaId: string;
  householdId: string;
  name: string;
  status: TaskStatus;
  createdByMembershipId: string;
  createdAt: string;
}

export interface CreateCommonAreaCommand {
  name: string;
  createdByMembershipId: string;
}

export interface HouseTask {
  taskId: string;
  householdId: string;
  commonAreaId: string;
  commonArea?: CommonArea;
  name: string;
  priority: number;
  assigneeLimit: number;
  status: TaskStatus;
  createdByMembershipId: string;
  createdAt: string;
}

export interface CreateTaskCommand {
  commonAreaId: string;
  name: string;
  priority: number;
  assigneeLimit: number;
  createdByMembershipId: string;
}

export interface TaskAssignment {
  assignmentId: string;
  membershipId: string;
  status: TaskAssignmentStatus;
  markedByMembershipId?: string;
  markedAt?: string;
}

export interface TaskWeekTask extends HouseTask {
  weeklyStatus: TaskAssignmentStatus;
  assignments: TaskAssignment[];
}

export interface TaskWeek {
  weekId: string;
  householdId: string;
  weekStart: string;
  weekEnd: string;
  createdByMembershipId: string;
  createdAt: string;
  tasks: TaskWeekTask[];
}

export interface GenerateTaskWeekCommand {
  weekStart: string | Date;
  createdByMembershipId: string;
}

export interface MarkTaskAssignmentCommand {
  status: Exclude<TaskAssignmentStatus, "PENDING">;
  markedByMembershipId: string;
}
