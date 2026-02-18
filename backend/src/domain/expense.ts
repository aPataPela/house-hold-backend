export type ExpenseStatus = "ACTIVE" | "CANCELLED";
export type ExpenseSplitMode = "AUTO_WEIGHTED" | "MANUAL";

export interface ExpenseItem {
  description: string;
  quantity?: number;
  unit?: string;
  note?: string;
}

export interface ExpenseShare {
  membershipId: string;
  assignedAmount: number;
  weightUsed?: number;
}

export interface ExpenseSplit {
  mode: ExpenseSplitMode;
  shares: ExpenseShare[];
}

export interface ExpenseAudit {
  createdByMembershipId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  householdId: string;
  categoryId: string;
  payerMembershipId: string;
  date: Date;
  totalAmount: number;
  status: ExpenseStatus;
  note?: string;
  items: ExpenseItem[];
  split: ExpenseSplit;
  audit: ExpenseAudit;
}
