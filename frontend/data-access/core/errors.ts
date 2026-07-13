import { ApiError } from "@/lib/api";

export type DataAccessErrorCode =
  | "INVALID_DATE"
  | "INVALID_MONTH"
  | "INVALID_MONEY"
  | "INVALID_INPUT"
  | "NETWORK_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export class DataAccessError extends Error {
  constructor(
    public readonly code: DataAccessErrorCode,
    message: string,
    public readonly status?: number,
    public readonly retryable = false,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DataAccessError";
  }
}

export function mapToDataAccessError(error: unknown): DataAccessError {
  if (error instanceof DataAccessError) {
    return error;
  }

  if (error instanceof ApiError) {
    const code = mapApiCode(error.code, error.status);
    return new DataAccessError(code, error.message, error.status, isRetryableStatus(error.status), error);
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new DataAccessError("NETWORK_ERROR", "The request was aborted.", 0, false, error);
    }
    return new DataAccessError("NETWORK_ERROR", error.message || "Network failure.", 0, true, error);
  }

  return new DataAccessError("UNKNOWN", "Unknown data access failure.", undefined, false, error);
}

function mapApiCode(code: string, status: number): DataAccessErrorCode {
  switch (code) {
    case "VALIDATION_ERROR":
      return "VALIDATION_ERROR";
    case "FORBIDDEN":
      return "FORBIDDEN";
    case "UNAUTHORIZED":
      return "UNAUTHORIZED";
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "CONFLICT":
      return "CONFLICT";
    default:
      if (status === 400) return "INVALID_INPUT";
      if (status === 401) return "UNAUTHORIZED";
      if (status === 403) return "FORBIDDEN";
      if (status === 404) return "NOT_FOUND";
      if (status === 409) return "CONFLICT";
      if (status >= 500) return "NETWORK_ERROR";
      return "UNKNOWN";
  }
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 0;
}

