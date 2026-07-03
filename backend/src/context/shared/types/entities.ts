export type Role = "ADMIN" | "MEMBER";
export type Status = "ACTIVE" | "CANCELLED";

export interface Household {
  id: string;
  name: string;
  currency: "CLP";
  approvalMode: "ADMIN_ONLY";
  createdAt: Date;
}

export interface Membership {
  id: string;
  householdId: string;
  userId: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  joinedAt: Date;
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
  mode: "INCLUDE_DEFAULT" | "EXCLUDE_DEFAULT";
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
}
