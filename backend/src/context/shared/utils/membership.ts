import type { Membership } from "../types/entities";

export const effectiveMembershipStart = (membership: Pick<Membership, "joinedAt" | "livingSince">) =>
  membership.livingSince ?? membership.joinedAt;

export const activeMembershipCriteria = (date: Date) => ({
  status: "ACTIVE" as const,
  $and: [
    {
      $or: [
        { livingSince: { $exists: false }, joinedAt: { $lte: endOfUtcDay(date) } },
        { livingSince: { $lte: endOfUtcDay(date) } },
      ],
    },
    {
      $or: [{ leftAt: null }, { leftAt: { $gt: date } }, { leftAt: { $exists: false } }],
    },
  ],
});

function endOfUtcDay(date: Date) {
  const result = new Date(date);
  result.setUTCHours(23, 59, 59, 999);
  return result;
}
