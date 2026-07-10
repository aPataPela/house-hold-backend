export type AppSection = "home" | "expenses" | "rules" | "house";

export type Session = {
  user: { userId: string; name: string; email: string };
  accessToken: string;
  refreshToken: string;
  householdId?: string;
  householdName?: string;
  currentMembershipId?: string;
  currentUserName: string;
  role?: "ADMIN" | "MEMBER";
  inviteCode?: string;
};

export type Member = {
  membershipId: string;
  householdId: string;
  householdName?: string;
  userId: string;
  userName?: string;
  role: "ADMIN" | "MEMBER";
};

export type Category = {
  categoryId: string;
  householdId?: string;
  name: string;
};

export type CommonArea = { commonAreaId: string; name: string };

export type ChoreTask = {
  choreTaskId: string;
  commonAreaId: string;
  name: string;
  priority: number;
  assigneeLimit: number;
  commonArea?: CommonArea;
};

export type ChoreAssignment = {
  assignmentId: string;
  membershipId: string;
  status: "PENDING" | "DONE" | "NOT_DONE";
};

export type ChoreWeekTask = ChoreTask & {
  weeklyStatus: "PENDING" | "DONE" | "NOT_DONE";
  assignments: ChoreAssignment[];
};

export type ChoreWeek = {
  choreWeekId: string;
  weekStart: string;
  weekEnd: string;
  tasks: ChoreWeekTask[];
};

export type Expense = {
  expenseId: string;
  categoryId: string;
  payerMembershipId: string;
  date: string;
  totalAmount: number;
  note?: string;
};

export type ExpenseDraft = {
  categoryId: string;
  date: string;
  totalAmount: number;
  note?: string;
};

export type Balance = {
  members: Array<{
    membershipId: string;
    paid: number;
    assigned: number;
    netBalance: number;
  }>;
};

export type Preference = {
  preferenceId: string;
  membershipId: string;
  categoryId: string;
  mode:
    | "PARTICIPATES"
    | "HALF"
    | "NO_PARTICIPATES"
    | "INCLUDE_DEFAULT"
    | "EXCLUDE_DEFAULT";
  weight: number;
  validFrom: string;
  validTo: string | null;
};

export type CategoryExclusion = {
  exclusionId: string;
  membershipId: string;
  categoryId: string;
  status: "ACTIVE" | "CANCELLED";
  periodStart: string;
  periodEnd: string;
  reason?: string;
};

export type ParticipationRules = {
  preferences: Preference[];
  exclusions: CategoryExclusion[];
};

export type PreferenceDraft = {
  categoryId: string;
  membershipId: string;
  mode:
    | "PARTICIPATES"
    | "HALF"
    | "NO_PARTICIPATES"
    | "INCLUDE_DEFAULT"
    | "EXCLUDE_DEFAULT";
  weight?: number;
  validFrom: string;
  validTo: string | null;
};

export type ExclusionDraft = {
  categoryId: string;
  membershipId: string;
  periodStart: string;
  periodEnd: string;
  reason?: string;
};

export type StoredData = {
  members: Member[];
  categories: Category[];
  areas: CommonArea[];
  tasks: ChoreTask[];
};

export type AuthResponse = {
  user: { userId: string; name: string; email: string };
  accessToken: string;
  refreshToken: string;
  memberships?: Member[];
};
