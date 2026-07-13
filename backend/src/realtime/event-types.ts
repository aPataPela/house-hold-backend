export const RealtimeEventType = {
  ParticipationPreferenceChanged: "participation.preference.changed",
  HouseholdCreated: "household.created",
  HouseholdMemberJoined: "household.member.joined",
  HouseholdInviteCodeRegenerated: "household.invite_code.regenerated",
  HouseholdMemberInvited: "household.member.invited",
  HouseholdCategoryCreated: "household.category.created",
  AbsenceCreated: "absence.created",
  AbsenceCancelled: "absence.cancelled",
  ChoreCommonAreaCreated: "chore.common_area.created",
  ChoreTaskCreated: "chore.task.created",
  ChoreWeekGenerated: "chore.week.generated",
  ChoreAssignmentUpdated: "chore.assignment.updated",
  ExpenseCreated: "expense.created",
  ExpensePaymentCreated: "expense.payment.created",
  ExpenseUpdated: "expense.updated",
} as const;

export type RealtimeEventType =
  (typeof RealtimeEventType)[keyof typeof RealtimeEventType];
