import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

function formatZodErrors(
  error: ZodError
): Array<{ field: string; message: string }> {
  return error.errors.map((err) => ({
    field: err.path.join(".") || "root",
    message: err.message,
  }));
}

export function validate(schema: ZodSchema): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      throw new ApiError(422, "Validation failed", errors);
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      throw new ApiError(422, "Query validation failed", errors);
    }

    req.query = result.data as Record<string, string>;
    next();
  };
}
