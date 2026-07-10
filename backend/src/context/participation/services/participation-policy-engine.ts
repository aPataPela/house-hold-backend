import { badRequest } from "../../shared/errors/app-error";
import { calculateWeightedSplit } from "../../shared/utils/weighted-split";

type ParticipationRule = {
  membershipId: string;
  mode: string;
  weight: number;
  validFrom: Date;
  validTo?: Date | null;
};

type HouseholdMember = { id: string };

type ResolvedParticipant = {
  membershipId: string;
  weight: number;
};

type SplitShare = {
  membershipId: string;
  assignedAmount: number;
  weightUsed: number;
};

type ParticipationResolver = (rule: ParticipationRule) => number;

const defaultResolvers = new Map<string, ParticipationResolver>([
  ["PARTICIPATES", () => 1],
  ["HALF", () => 0.5],
  ["NO_PARTICIPATES", () => 0],
  ["INCLUDE_DEFAULT", (rule) => rule.weight ?? 1],
  ["EXCLUDE_DEFAULT", () => 0],
]);

export class ParticipationPolicyEngine {
  constructor(private readonly resolvers = defaultResolvers) {}

  calculateSplit(
    totalAmount: number,
    input: {
      members: HouseholdMember[];
      preferences: ParticipationRule[];
      date: Date;
    },
  ): SplitShare[] {
    const participants = this.resolveParticipants(input);
    return calculateWeightedSplit(totalAmount, participants).map((share) => ({
      membershipId: share.membershipId,
      assignedAmount: share.assignedAmount,
      weightUsed: share.weight,
    }));
  }

  resolveParticipants(input: {
    members: HouseholdMember[];
    preferences: ParticipationRule[];
    date: Date;
  }): ResolvedParticipant[] {
    const latestByMember = new Map<string, ParticipationRule>();
    for (const preference of [...input.preferences].sort(
      (a, b) => b.validFrom.getTime() - a.validFrom.getTime(),
    )) {
      if (preference.validFrom > input.date) continue;
      if (preference.validTo && preference.validTo <= input.date) continue;
      if (!latestByMember.has(preference.membershipId)) {
        latestByMember.set(preference.membershipId, preference);
      }
    }

    const participants = input.members.flatMap((member) => {
      const rule = latestByMember.get(member.id);
      const weight = rule ? this.resolveWeight(rule) : 1;
      if (!Number.isFinite(weight) || weight < 0) {
        throw badRequest("INVALID_PARTICIPATION_RULE", "participation rules must resolve to a non-negative number");
      }
      if (weight <= 0) return [];
      return [{ membershipId: member.id, weight }];
    });

    if (!participants.length) {
      throw badRequest("INVALID_PARTICIPANTS", "at least one member must participate");
    }
    return participants;
  }

  private resolveWeight(rule: ParticipationRule): number {
    const resolver = this.resolvers.get(rule.mode);
    if (resolver) return resolver(rule);
    if (rule.mode === "CUSTOM") return rule.weight;
    return rule.weight;
  }
}
