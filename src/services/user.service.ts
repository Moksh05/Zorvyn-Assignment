import mongoose from "mongoose";
import { User } from "../models/user.model";
import { FinancialRecord } from "../models/record.model";
import { ApiError } from "../utils/ApiError";
import { CreateUserInput, UpdateUserInput } from "../schemas/user.schema";

interface UserFilters {
  page: number;
  limit: number;
  status?: string;
  role?: string;
  search?: string;
}

export async function createUser(
  data: CreateUserInput
): Promise<Record<string, unknown>> {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role ?? "viewer",
    status: data.status ?? "active",
  });

  return user.toSafeObject();
}

export async function getUsers(filters: UserFilters): Promise<{
  results: Record<string, unknown>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const query: Record<string, unknown> = {};

  if (filters.status) query["status"] = filters.status;
  if (filters.role) query["role"] = filters.role;
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, "i");
    query["$or"] = [{ name: searchRegex }, { email: searchRegex }];
  }

  const { page, limit } = filters;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  return {
    results: users.map((u) => {
      const obj = { ...u } as Record<string, unknown>;
      delete obj["password"];
      return obj;
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(
  id: string
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid user ID");
  }

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user.toSafeObject();
}

export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid user ID");
  }

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw ApiError.conflict("A user with this email already exists");
    }
    user.email = data.email;
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.status !== undefined) user.status = data.status;
  if (data.role !== undefined) user.role = data.role;

  await user.save();
  return user.toSafeObject();
}

export async function deleteUser(
  id: string
): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid user ID");
  }

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  user.status = "inactive";
  await user.save();

  return user.toSafeObject();
}

export async function getUserStats(userId: string): Promise<{
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: unknown[];
  monthlyTrend: unknown[];
}> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest("Invalid user ID");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [incomeResult, expenseResult, categoryBreakdown, monthlyTrend] =
    await Promise.all([
      FinancialRecord.aggregate([
        { $match: { userId: userObjectId, type: "income", isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      FinancialRecord.aggregate([
        { $match: { userId: userObjectId, type: "expense", isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      FinancialRecord.aggregate([
        { $match: { userId: userObjectId, isDeleted: false } },
        {
          $group: {
            _id: { category: "$category", type: "$type" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            category: "$_id.category",
            type: "$_id.type",
            total: 1,
            count: 1,
            _id: 0,
          },
        },
        { $sort: { total: -1 } },
      ]),
      FinancialRecord.aggregate([
        { $match: { userId: userObjectId, isDeleted: false } },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },
            totalExpense: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },
          },
        },
        {
          $project: {
            month: "$_id.month",
            year: "$_id.year",
            totalIncome: 1,
            totalExpense: 1,
            _id: 0,
          },
        },
        { $sort: { year: 1, month: 1 } },
      ]),
    ]);

  return {
    totalIncome: (incomeResult[0] as { total?: number } | undefined)?.total ?? 0,
    totalExpense: (expenseResult[0] as { total?: number } | undefined)?.total ?? 0,
    categoryBreakdown,
    monthlyTrend,
  };
}
