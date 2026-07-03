import { badRequest } from "../errors/app-error";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const parseDate = (value: string, field: string): Date => {
  if (!ISO_DATE.test(value)) throw badRequest("INVALID_DATE", `${field} must use YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw badRequest("INVALID_DATE", `${field} must be a valid date`);
  }
  return date;
};

export const toDateString = (value: Date): string => value.toISOString().slice(0, 10);
