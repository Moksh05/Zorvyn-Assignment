import { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";

export function authorize(
  ...roles: Array<"admin" | "analyst" | "viewer">
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    next();
  };
}
