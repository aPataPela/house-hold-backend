export type MembershipRole = "ADMIN" | "MEMBER";
export type MembershipStatus = "ACTIVE" | "INACTIVE";

export interface Membership {
  id: string;
  householdId: string;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: Date;
  leftAt?: Date | null;
}

export const isMembershipActiveOn = (membership: Membership, date: Date): boolean => {
  if (membership.status !== "ACTIVE") {
    return false;
  }
  if (membership.joinedAt > date) {
    return false;
  }
  if (membership.leftAt && membership.leftAt <= date) {
    return false;
  }
  return true;
};
