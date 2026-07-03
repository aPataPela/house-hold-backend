import type { Expense } from "../types/entities";
import { badRequest } from "../errors/app-error";

export const encodeExpenseCursor = (expense: Expense) =>
  Buffer.from(JSON.stringify({ date: expense.date.toISOString(), id: expense.id })).toString("base64url");

export const decodeExpenseCursor = (value: string) => {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString()) as { date: string; id: string };
    const date = new Date(parsed.date);
    if (!parsed.id || Number.isNaN(date.getTime())) throw new Error();
    return { date, id: parsed.id };
  } catch {
    throw badRequest("INVALID_CURSOR", "cursor is invalid");
  }
};
