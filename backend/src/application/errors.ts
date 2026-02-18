export class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
}

export class NotFoundError extends Error {
  readonly code = "NOT_FOUND";
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN";
}

export class ConflictError extends Error {
  readonly code = "CONFLICT";
}
