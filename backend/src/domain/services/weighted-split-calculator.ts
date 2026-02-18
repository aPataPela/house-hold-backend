import type { ExpenseShare } from "../expense.js";

export interface WeightedParticipant {
  membershipId: string;
  weight: number;
}

export class WeightedSplitCalculator {
  calculate(totalAmount: number, participants: WeightedParticipant[]): ExpenseShare[] {
    this.validate(totalAmount, participants);

    const totalWeight = participants.reduce((acc, participant) => acc + participant.weight, 0);

    const withMath = participants.map((participant, index) => {
      const raw = (totalAmount * participant.weight) / totalWeight;
      const floor = Math.floor(raw + 1e-9);
      const fraction = raw - floor;

      return {
        index,
        membershipId: participant.membershipId,
        weight: participant.weight,
        floor,
        fraction,
      };
    });

    const floorSum = withMath.reduce((acc, row) => acc + row.floor, 0);
    const remainder = totalAmount - floorSum;

    const ranked = [...withMath].sort((a, b) => {
      const fractionDiff = b.fraction - a.fraction;
      if (Math.abs(fractionDiff) > 1e-12) {
        return fractionDiff;
      }
      return a.membershipId.localeCompare(b.membershipId);
    });

    for (let i = 0; i < remainder; i += 1) {
      const row = ranked[i % ranked.length];
      if (!row) {
        throw new Error("unable to assign remainder");
      }
      row.floor += 1;
    }

    const assignedByMembership = new Map(ranked.map((row) => [row.membershipId, row.floor]));

    return participants.map((participant) => ({
      membershipId: participant.membershipId,
      assignedAmount: assignedByMembership.get(participant.membershipId) ?? 0,
      weightUsed: participant.weight,
    }));
  }

  private validate(totalAmount: number, participants: WeightedParticipant[]): void {
    if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
      throw new Error("totalAmount must be a positive integer in CLP");
    }

    if (participants.length === 0) {
      throw new Error("participants must not be empty");
    }

    const uniqueMembers = new Set<string>();
    for (const participant of participants) {
      if (!participant.membershipId) {
        throw new Error("participant membershipId is required");
      }

      if (!Number.isFinite(participant.weight) || participant.weight <= 0) {
        throw new Error("participant weight must be > 0");
      }

      if (uniqueMembers.has(participant.membershipId)) {
        throw new Error(`duplicated participant membershipId: ${participant.membershipId}`);
      }

      uniqueMembers.add(participant.membershipId);
    }
  }
}
