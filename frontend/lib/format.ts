import type { Member } from "@/lib/domain";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatBalance(value: number): string {
  if (value === 0) return "Estás al día";
  return value > 0
    ? `Te deben ${formatCurrency(value)}`
    : `Debes ${formatCurrency(Math.abs(value))}`;
}

export function memberName(members: Member[], membershipId: string): string {
  const member = members.find((item) => item.membershipId === membershipId);
  return member?.userName ?? member?.userId ?? membershipId.slice(0, 8);
}

export function displayMemberName(member: Member): string {
  return member.userName ?? member.userId;
}
