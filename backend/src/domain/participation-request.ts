export type CategoryParticipationRequestType = "TEMPORARY_EXCLUDE";
export type CategoryParticipationRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CategoryParticipationDecision {
  decidedByMembershipId: string;
  decidedAt: Date;
  comment?: string;
}

export interface CategoryParticipationChangeRequest {
  id: string;
  householdId: string;
  membershipId: string;
  categoryId: string;
  requestType: CategoryParticipationRequestType;
  periodStart: Date;
  periodEnd: Date;
  reason: string;
  status: CategoryParticipationRequestStatus;
  decision?: CategoryParticipationDecision;
  createdAt: Date;
}

export const isApprovedTemporaryExclusionActiveOn = (
  request: CategoryParticipationChangeRequest,
  date: Date,
): boolean => {
  if (request.requestType !== "TEMPORARY_EXCLUDE" || request.status !== "APPROVED") {
    return false;
  }

  return request.periodStart <= date && date < request.periodEnd;
};
