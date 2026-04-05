import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

interface TokenPayload {
  _id: string;
  role: "admin" | "analyst" | "viewer";
  status: "active" | "inactive";
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized("No token provided");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw ApiError.unauthorized("No token provided");
  }

  const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

  if (decoded.status === "inactive") {
    throw ApiError.forbidden("Account is inactive");
  }

  req.user = {
    _id: decoded._id,
    role: decoded.role,
    status: decoded.status,
  };

  next();
}
