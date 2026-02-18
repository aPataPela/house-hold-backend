export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class RouteNotFoundError extends HttpError {
  constructor(path: string) {
    super(404, "ROUTE_NOT_FOUND", `route not found: ${path}`);
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(method: string, path: string) {
    super(405, "METHOD_NOT_ALLOWED", `method ${method} not allowed for ${path}`);
  }
}
