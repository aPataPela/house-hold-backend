import { DataAccessError } from "./errors";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export type DateLike = string | Date;

export function normalizeDate(value: DateLike): string {
  const normalized = value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  if (!DATE_RE.test(normalized)) {
    throw new DataAccessError("INVALID_DATE", `Invalid date value: ${String(value)}`);
  }
  return normalized;
}

export function normalizeMonth(value: string | Date): string {
  const normalized =
    value instanceof Date
      ? `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`
      : value.slice(0, 7);
  if (!MONTH_RE.test(normalized)) {
    throw new DataAccessError("INVALID_MONTH", `Invalid month value: ${String(value)}`);
  }
  return normalized;
}

export function normalizeMoney(value: number): number {
  if (!Number.isFinite(value)) {
    throw new DataAccessError("INVALID_MONEY", "Money value must be finite.");
  }
  return Math.trunc(value);
}

export function parseDate(value: string): Date {
  const normalized = normalizeDate(value);
  return new Date(`${normalized}T00:00:00.000Z`);
}

export function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

export function compareDates(a: string, b: string): number {
  return parseDate(a).getTime() - parseDate(b).getTime();
}

export function daysBetweenInclusive(from: string, to: string): number {
  const start = parseDate(from).getTime();
  const end = parseDate(to).getTime();
  return Math.floor((end - start) / 86400000) + 1;
}

export function monthRange(month: string): { from: string; to: string } {
  const normalized = normalizeMonth(month);
  const [year, monthNumber] = normalized.split("-").map(Number);
  const from = `${normalized}-01`;
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1));
  const to = nextMonth.toISOString().slice(0, 10);
  return { from, to };
}

export function startOfMonth(month: string): string {
  return `${normalizeMonth(month)}-01`;
}

export function endOfMonth(month: string): string {
  return monthRange(month).to;
}

