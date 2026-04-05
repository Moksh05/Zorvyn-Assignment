import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

interface MongooseValidationError {
  name: "ValidationError";
  errors: Record<string, { message: string }>;
}

interface MongooseCastError {
  name: "CastError";
  path: string;
}

interface MongooseDuplicateKeyError {
  code: number;
  keyValue: Record<string, unknown>;
}

function isMongooseValidationError(
  err: unknown
): err is MongooseValidationError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "ValidationError" &&
    "errors" in err
  );
}

function isMongooseCastError(err: unknown): err is MongooseCastError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "CastError"
  );
}

function isMongooseDuplicateKeyError(
  err: unknown
): err is MongooseDuplicateKeyError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  );
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[ErrorHandler]", err);

  // ApiError (operational errors)
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : undefined,
    });
    return;
  }

  // Mongoose ValidationError
  if (isMongooseValidationError(err)) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.message,
      message: e.message,
    }));
    res.status(422).json({
      success: false,
      message: "Validation error",
      errors,
    });
    return;
  }

  // Mongoose CastError
  if (isMongooseCastError(err)) {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
    return;
  }

  // MongoDB duplicate key error
  if (isMongooseDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue)[0] ?? "field";
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
    return;
  }

  // JWT Errors
  if (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "JsonWebTokenError"
  ) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
    return;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "TokenExpiredError"
  ) {
    res.status(401).json({
      success: false,
      message: "Token expired",
    });
    return;
  }

  // Generic error fallback
  const isDev = env.NODE_ENV === "development";
  const stack =
    err instanceof Error ? err.stack : undefined;

  res.status(500).json({
    success: false,
    message: isDev && err instanceof Error ? err.message : "Internal server error",
    ...(isDev && { stack }),
  });
}
