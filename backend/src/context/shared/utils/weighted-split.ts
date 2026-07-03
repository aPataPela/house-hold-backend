import { badRequest } from "../errors/app-error";

export interface WeightedParticipant {
  membershipId: string;
  weight: number;
}

export interface WeightedShare extends WeightedParticipant {
  assignedAmount: number;
}

export const calculateWeightedSplit = (
  totalAmount: number,
  participants: WeightedParticipant[],
): WeightedShare[] => {
  if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
    throw badRequest("INVALID_AMOUNT", "totalAmount must be a positive CLP integer");
  }
  if (
    !participants.length ||
    participants.some((item) => !Number.isFinite(item.weight) || item.weight <= 0)
  ) {
    throw badRequest("INVALID_PARTICIPANTS", "participants must have positive weights");
  }
  const totalWeight = participants.reduce((sum, item) => sum + item.weight, 0);
  const calculated = participants.map((item, index) => {
    const raw = (totalAmount * item.weight) / totalWeight;
    return { ...item, index, assignedAmount: Math.floor(raw), fraction: raw - Math.floor(raw) };
  });
  const remainder = totalAmount - calculated.reduce((sum, item) => sum + item.assignedAmount, 0);
  const ranked = [...calculated].sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let index = 0; index < remainder; index += 1) ranked[index]!.assignedAmount += 1;
  return calculated.map(({ membershipId, weight, assignedAmount }) => ({
    membershipId,
    weight,
    assignedAmount,
  }));
};
