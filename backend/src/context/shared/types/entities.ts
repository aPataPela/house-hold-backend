export type Role = "ADMIN" | "MEMBER";
export type Status = "ACTIVE" | "CANCELLED";
export type ChoreAssignmentStatus = "PENDING" | "DONE" | "NOT_DONE";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date | null;
}

export interface Household {
  id: string;
  name: string;
  currency: "CLP";
  approvalMode: "ADMIN_ONLY";
  inviteCode?: string;
  createdAt: Date;
}

export interface Membership {
  id: string;
  householdId: string;
  householdName?: string;
  userId: string;
  userName?: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  joinedAt: Date;
  livingSince?: Date | null;
  leftAt?: Date | null;
}

export interface Category {
  id: string;
  householdId: string;
  name: string;
  normalizedName: string;
  status: "ACTIVE";
  createdAt: Date;
}

export interface Preference {
  id: string;
  householdId: string;
  membershipId: string;
  categoryId: string;
  mode:
    | "PARTICIPATES"
    | "HALF"
    | "NO_PARTICIPATES"
    | "INCLUDE_DEFAULT"
    | "EXCLUDE_DEFAULT";
  weight: number;
  validFrom: Date;
  validTo?: Date | null;
}

export interface CategoryExclusion {
  id: string;
  householdId: string;
  membershipId: string;
  categoryId: string;
  periodStart: Date;
  periodEnd: Date;
  reason?: string;
  status: "ACTIVE" | "CANCELLED";
  createdByMembershipId: string;
  createdAt: Date;
  cancelledByMembershipId?: string;
  cancelledAt?: Date;
}

export interface ExpenseShare {
  membershipId: string;
  assignedAmount: number;
  weightUsed?: number;
}

export interface ExpensePayment {
  id: string;
  householdId: string;
  expenseId: string;
  membershipId: string;
  amount: number;
  createdByMembershipId: string;
  createdAt: Date;
  kind?: "AUTO_PAYER_SETTLEMENT" | "MANUAL";
}

export interface ExpenseShareSettlement extends ExpenseShare {
  paidAmount: number;
  remainingAmount: number;
  status: "PENDING" | "PARTIAL" | "PAID";
}

export interface ExpenseSettlement {
  payments: ExpensePayment[];
  shares: ExpenseShareSettlement[];
}

export interface Expense {
  id: string;
  householdId: string;
  categoryId: string;
  payerMembershipId: string;
  date: Date;
  totalAmount: number;
  note?: string;
  status: Status;
  items: Array<{
    description: string;
    quantity?: number | undefined;
    unit?: string | undefined;
    note?: string | undefined;
  }>;
  split: { mode: "AUTO_WEIGHTED" | "MANUAL"; shares: ExpenseShare[] };
  audit: { createdByMembershipId: string; createdAt: Date; updatedAt: Date };
  settlement?: ExpenseSettlement;
}

export interface CommonArea {
  id: string;
  householdId: string;
  name: string;
  normalizedName: string;
  status: "ACTIVE";
  createdByMembershipId: string;
  createdAt: Date;
}

export interface ChoreTask {
  id: string;
  householdId: string;
  commonAreaId: string;
  name: string;
  normalizedName: string;
  priority: number;
  assigneeLimit: number;
  status: "ACTIVE";
  createdByMembershipId: string;
  createdAt: Date;
}

export interface ChoreWeek {
  id: string;
  householdId: string;
  weekStart: Date;
  weekEnd: Date;
  createdByMembershipId: string;
  createdAt: Date;
}

export interface ChoreAssignment {
  id: string;
  householdId: string;
  weekId: string;
  weekStart: Date;
  weekEnd: Date;
  commonAreaId: string;
  taskId: string;
  membershipId: string;
  status: ChoreAssignmentStatus;
  markedByMembershipId?: string;
  markedAt?: Date;
  createdAt: Date;
}
