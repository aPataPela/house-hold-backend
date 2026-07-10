import type { Membership } from "../types/entities";

export const effectiveMembershipStart = (membership: Pick<Membership, "joinedAt" | "livingSince">) =>
  membership.livingSince ?? membership.joinedAt;

export const activeMembershipCriteria = (date: Date) => ({
  status: "ACTIVE" as const,
  $and: [
    {
      $or: [
        { livingSince: { $exists: false }, joinedAt: { $lte: date } },
        { livingSince: { $lte: date } },
      ],
    },
    {
      $or: [{ leftAt: null }, { leftAt: { $gt: date } }, { leftAt: { $exists: false } }],
    },
  ],
});
