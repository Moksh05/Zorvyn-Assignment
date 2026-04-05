export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown[];
  public readonly isOperational: boolean = true;

  constructor(statusCode: number, message: string, errors: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string, errors?: unknown[]): ApiError {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg: string, errors?: unknown[]): ApiError {
    return new ApiError(401, msg, errors);
  }

  static forbidden(msg: string, errors?: unknown[]): ApiError {
    return new ApiError(403, msg, errors);
  }

  static notFound(msg: string, errors?: unknown[]): ApiError {
    return new ApiError(404, msg, errors);
  }

  static conflict(msg: string, errors?: unknown[]): ApiError {
    return new ApiError(409, msg, errors);
  }

  static internal(msg: string, errors?: unknown[]): ApiError {
    return new ApiError(500, msg, errors);
  }
}
