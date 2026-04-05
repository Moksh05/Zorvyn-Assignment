import { Request, Response } from "express";
import * as analyticsService from "../services/analytics.service";
import { ApiResponse } from "../utils/ApiResponse";

type ReqUser = NonNullable<Request["user"]>;

function resolveUserId(
  requestingUser: ReqUser,
  queryUserId?: string
): string | undefined {
  if (requestingUser.role === "viewer") {
    return requestingUser._id;
  }
  if (requestingUser.role === "analyst") {
    return queryUserId ?? requestingUser._id;
  }
  // admin
  return queryUserId ?? undefined;
}

function resolveDateRange(
  startDate?: string | Date,
  endDate?: string | Date
): { start: Date; end: Date } | undefined {
  if (!startDate && !endDate) return undefined;
  return {
    start: startDate ? new Date(startDate) : new Date("2000-01-01"),
    end: endDate ? new Date(endDate) : new Date(),
  };
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  const userId = resolveUserId(
    req.user!,
    req.query["userId"] as string | undefined
  );
  const dateRange = resolveDateRange(
    req.query["startDate"] as string | undefined,
    req.query["endDate"] as string | undefined
  );

  const summary = await analyticsService.getSummary(userId, dateRange);
  const response = ApiResponse.success(summary, "Dashboard summary fetched");
  res.status(response.statusCode).json(response);
}

export async function getMonthlyExpenditure(
  req: Request,
  res: Response
): Promise<void> {
  const userId = resolveUserId(
    req.user!,
    req.query["userId"] as string | undefined
  );
  const yearParam = req.query["year"] as string | undefined;
  const year = yearParam ? parseInt(yearParam, 10) : undefined;

  const data = await analyticsService.getMonthlyExpenditure(userId, year);
  const response = ApiResponse.success(data, "Monthly expenditure fetched");
  res.status(response.statusCode).json(response);
}

export async function getCategoryBreakdown(
  req: Request,
  res: Response
): Promise<void> {
  const userId = resolveUserId(
    req.user!,
    req.query["userId"] as string | undefined
  );
  const type = req.query["type"] as "income" | "expense" | undefined;
  const dateRange = resolveDateRange(
    req.query["startDate"] as string | undefined,
    req.query["endDate"] as string | undefined
  );

  const data = await analyticsService.getCategoryBreakdown(userId, type, dateRange);
  const response = ApiResponse.success(data, "Category breakdown fetched");
  res.status(response.statusCode).json(response);
}

export async function getCategoryByMonth(
  req: Request,
  res: Response
): Promise<void> {
  const userId = resolveUserId(
    req.user!,
    req.query["userId"] as string | undefined
  );
  const yearParam = req.query["year"] as string | undefined;
  const year = yearParam ? parseInt(yearParam, 10) : undefined;

  const data = await analyticsService.getCategoryByMonth(userId, year);
  const response = ApiResponse.success(data, "Category trends fetched");
  res.status(response.statusCode).json(response);
}

export async function getPerUserStats(
  req: Request,
  res: Response
): Promise<void> {
  const dateRange = resolveDateRange(
    req.query["startDate"] as string | undefined,
    req.query["endDate"] as string | undefined
  );

  const data = await analyticsService.getPerUserStats(dateRange);
  const response = ApiResponse.success(data, "Per-user stats fetched");
  res.status(response.statusCode).json(response);
}

export async function getPerUserCategoryBreakdown(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.params["userId"] as string;
  const dateRange = resolveDateRange(
    req.query["startDate"] as string | undefined,
    req.query["endDate"] as string | undefined
  );

  const data = await analyticsService.getPerUserCategoryBreakdown(userId, dateRange);
  const response = ApiResponse.success(data, "Per-user category breakdown fetched");
  res.status(response.statusCode).json(response);
}
