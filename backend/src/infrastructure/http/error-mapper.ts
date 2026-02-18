import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../application/errors.js";
import { HttpError } from "./http-error.js";

export interface HttpErrorPayload {
  statusCode: number;
  body: {
    error: {
      code: string;
      message: string;
    };
  };
}

export const mapErrorToHttp = (error: unknown): HttpErrorPayload => {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      statusCode: 403,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  if (error instanceof NotFoundError) {
    return {
      statusCode: 404,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  if (error instanceof ConflictError) {
    return {
      statusCode: 409,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "unexpected internal error",
      },
    },
  };
};
