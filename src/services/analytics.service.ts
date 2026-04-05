import mongoose from "mongoose";
import { FinancialRecord } from "../models/record.model";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthlyData {
  month: number;
  year: number;
  monthLabel: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  count: number;
}

interface CategoryData {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

interface CategoryByMonthData {
  month: number;
  year: number;
  monthLabel: string;
  categories: Array<{ category: string; total: number; count: number }>;
}

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: string;
  recordCount: number;
  recentActivity: unknown[];
  topExpenseCategory: CategoryData | null;
}

interface PerUserStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  recordCount: number;
}

interface PerUserCategoryBreakdown {
  income: CategoryData[];
  expense: CategoryData[];
}

function buildBaseMatch(
  userId?: string,
  dateRange?: { start: Date; end: Date }
): Record<string, unknown> {
  const match: Record<string, unknown> = { isDeleted: false };
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    match["userId"] = new mongoose.Types.ObjectId(userId);
  }
  if (dateRange) {
    match["date"] = { $gte: dateRange.start, $lte: dateRange.end };
  }
  return match;
}

export async function getMonthlyExpenditure(
  userId?: string,
  year?: number
): Promise<MonthlyData[]> {
  const match: Record<string, unknown> = { isDeleted: false };
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    match["userId"] = new mongoose.Types.ObjectId(userId);
  }
  if (year) {
    match["date"] = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  const results = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: { year: { $year: "$date" }, month: { $month: "$date" } },
        totalIncome: {
          $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        month: "$_id.month",
        year: "$_id.year",
        totalIncome: 1,
        totalExpense: 1,
        netBalance: { $subtract: ["$totalIncome", "$totalExpense"] },
        count: 1,
        _id: 0,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  return results.map((r: {
    month: number;
    year: number;
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    count: number;
  }) => ({
    ...r,
    monthLabel: MONTH_LABELS[(r.month - 1)] ?? "",
  }));
}

export async function getCategoryBreakdown(
  userId?: string,
  type?: "income" | "expense",
  dateRange?: { start: Date; end: Date }
): Promise<CategoryData[]> {
  const match = buildBaseMatch(userId, dateRange);
  if (type) match["type"] = type;

  const results = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const grandTotal = results.reduce(
    (sum: number, r: { total: number }) => sum + r.total,
    0
  );

  return results.map((r: { _id: string; total: number; count: number }) => ({
    category: r._id,
    total: r.total,
    count: r.count,
    percentage: grandTotal > 0
      ? parseFloat(((r.total / grandTotal) * 100).toFixed(2))
      : 0,
  }));
}

export async function getCategoryByMonth(
  userId?: string,
  year?: number
): Promise<CategoryByMonthData[]> {
  const match: Record<string, unknown> = { isDeleted: false, type: "expense" };
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    match["userId"] = new mongoose.Types.ObjectId(userId);
  }
  if (year) {
    match["date"] = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  const results = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          category: "$category",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, total: -1 } },
    {
      $group: {
        _id: { year: "$_id.year", month: "$_id.month" },
        categories: {
          $push: { category: "$_id.category", total: "$total", count: "$count" },
        },
      },
    },
    {
      $project: {
        month: "$_id.month",
        year: "$_id.year",
        categories: 1,
        _id: 0,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  return results.map((r: {
    month: number;
    year: number;
    categories: Array<{ category: string; total: number; count: number }>;
  }) => ({
    ...r,
    monthLabel: MONTH_LABELS[(r.month - 1)] ?? "",
  }));
}

export async function getSummary(
  userId?: string,
  dateRange?: { start: Date; end: Date }
): Promise<SummaryData> {
  const match = buildBaseMatch(userId, dateRange);

  const [
    incomeResult,
    expenseResult,
    recordCount,
    recentActivity,
    topExpenseCategoryArr,
  ] = await Promise.all([
    FinancialRecord.aggregate([
      { $match: { ...match, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    FinancialRecord.aggregate([
      { $match: { ...match, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    FinancialRecord.countDocuments(match),
    FinancialRecord.find(match)
      .sort({ date: -1 })
      .limit(5)
      .populate("userId", "name")
      .populate("tags", "name color")
      .lean(),
    getCategoryBreakdown(userId, "expense", dateRange),
  ]);

  const totalIncome =
    (incomeResult[0] as { total?: number } | undefined)?.total ?? 0;
  const totalExpense =
    (expenseResult[0] as { total?: number } | undefined)?.total ?? 0;
  const netBalance = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0
      ? ((netBalance / totalIncome) * 100).toFixed(2)
      : "0.00";

  return {
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    recordCount,
    recentActivity,
    topExpenseCategory: topExpenseCategoryArr[0] ?? null,
  };
}

export async function getPerUserStats(dateRange?: {
  start: Date;
  end: Date;
}): Promise<PerUserStats[]> {
  const match: Record<string, unknown> = { isDeleted: false };
  if (dateRange) {
    match["date"] = { $gte: dateRange.start, $lte: dateRange.end };
  }

  return FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$userId",
        totalIncome: {
          $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
        },
        recordCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        userId: "$_id",
        userName: { $ifNull: ["$user.name", "Deleted User"] },
        userEmail: { $ifNull: ["$user.email", ""] },
        totalIncome: 1,
        totalExpense: 1,
        netBalance: { $subtract: ["$totalIncome", "$totalExpense"] },
        recordCount: 1,
        _id: 0,
      },
    },
    { $sort: { totalExpense: -1 } },
  ]);
}

export async function getPerUserCategoryBreakdown(
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<PerUserCategoryBreakdown> {
  const [incomeCategories, expenseCategories] = await Promise.all([
    getCategoryBreakdown(userId, "income", dateRange),
    getCategoryBreakdown(userId, "expense", dateRange),
  ]);

  return {
    income: incomeCategories,
    expense: expenseCategories,
  };
}
