import mongoose from "mongoose";
import { FinancialRecord } from "../models/record.model";
import { Tag } from "../models/tag.model";
import { ApiError } from "../utils/ApiError";
import { CreateRecordInput, UpdateRecordInput, RecordFilterInput } from "../schemas/record.schema";

interface ReqUser {
  _id: string;
  role: "admin" | "analyst" | "viewer";
  status: "active" | "inactive";
}

async function validateTagIds(tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return;

  const validIds = tagIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length !== tagIds.length) {
    throw ApiError.badRequest("One or more tag IDs are invalid");
  }

  const objectIds = validIds.map((id) => new mongoose.Types.ObjectId(id));
  const count = await Tag.countDocuments({ _id: { $in: objectIds } });
  if (count !== tagIds.length) {
    throw ApiError.notFound("One or more tags not found");
  }
}

export async function createRecord(
  userId: string,
  data: CreateRecordInput
): Promise<unknown> {
  if (data.tags && data.tags.length > 0) {
    await validateTagIds(data.tags);
  }

  const tagObjectIds = (data.tags ?? []).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const record = await FinancialRecord.create({
    userId: new mongoose.Types.ObjectId(userId),
    amount: data.amount,
    type: data.type,
    category: data.category,
    date: data.date,
    tags: tagObjectIds,
    notes: data.notes,
  });

  return FinancialRecord.findById(record._id)
    .populate("userId", "name email")
    .populate("tags", "name color")
    .lean();
}

export async function getRecords(
  requestingUser: ReqUser,
  filters: RecordFilterInput
): Promise<{
  results: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const query: Record<string, unknown> = { isDeleted: false };

  // Role-based userId scoping
  if (requestingUser.role === "viewer") {
    query["userId"] = new mongoose.Types.ObjectId(requestingUser._id);
  } else if (requestingUser.role === "analyst") {
    if (filters.userId) {
      query["userId"] = new mongoose.Types.ObjectId(filters.userId);
    } else {
      query["userId"] = new mongoose.Types.ObjectId(requestingUser._id);
    }
  } else if (requestingUser.role === "admin") {
    if (filters.userId) {
      query["userId"] = new mongoose.Types.ObjectId(filters.userId);
    }
  }

  if (filters.type) query["type"] = filters.type;
  if (filters.category) {
    query["category"] = new RegExp(filters.category, "i");
  }

  if (filters.tags) {
    const tagIds = filters.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (tagIds.length > 0) {
      query["tags"] = { $in: tagIds };
    }
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, "i");
    query["$or"] = [{ notes: searchRegex }, { category: searchRegex }];
  }

  if (filters.startDate || filters.endDate) {
    const dateQuery: Record<string, Date> = {};
    if (filters.startDate) dateQuery["$gte"] = filters.startDate;
    if (filters.endDate) dateQuery["$lte"] = filters.endDate;
    query["date"] = dateQuery;
  }

  const sortField = filters.sortBy ?? "date";
  const sortDirection = filters.sortOrder === "asc" ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const { page, limit } = filters;
  const skip = ((page ?? 1) - 1) * (limit ?? 10);

  const [records, total] = await Promise.all([
    FinancialRecord.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit ?? 10)
      .populate("userId", "name email")
      .populate("tags", "name color")
      .lean(),
    FinancialRecord.countDocuments(query),
  ]);

  return {
    results: records,
    pagination: {
      page: page ?? 1,
      limit: limit ?? 10,
      total,
      totalPages: Math.ceil(total / (limit ?? 10)),
    },
  };
}

export async function getRecordById(
  id: string,
  requestingUser: ReqUser
): Promise<unknown> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid record ID");
  }

  const record = await FinancialRecord.findById(id)
    .populate("userId", "name email")
    .populate("tags", "name color")
    .lean();

  if (!record) {
    throw ApiError.notFound("Record not found");
  }

  if (requestingUser.role === "viewer") {
    const recordUserId = (record.userId as { _id: mongoose.Types.ObjectId } | mongoose.Types.ObjectId);
    const uid = recordUserId instanceof mongoose.Types.ObjectId
      ? recordUserId.toString()
      : (recordUserId as { _id: mongoose.Types.ObjectId })._id.toString();
    if (uid !== requestingUser._id) {
      throw ApiError.forbidden("Access denied");
    }
  }

  return record;
}

export async function updateRecord(
  id: string,
  requestingUser: ReqUser,
  data: UpdateRecordInput
): Promise<unknown> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid record ID");
  }

  const record = await FinancialRecord.findById(id);
  if (!record || record.isDeleted) {
    throw ApiError.notFound("Record not found");
  }

  if (requestingUser.role === "viewer") {
    throw ApiError.forbidden("Insufficient permissions");
  }

  if (requestingUser.role === "analyst") {
    if (record.userId.toString() !== requestingUser._id) {
      throw ApiError.forbidden("You can only update your own records");
    }
  }

  if (data.tags && data.tags.length > 0) {
    await validateTagIds(data.tags);
    record.tags = data.tags.map((id) => new mongoose.Types.ObjectId(id));
  } else if (data.tags !== undefined) {
    record.tags = [];
  }

  if (data.amount !== undefined) record.amount = data.amount;
  if (data.type !== undefined) record.type = data.type;
  if (data.category !== undefined) record.category = data.category;
  if (data.date !== undefined) record.date = data.date;
  if (data.notes !== undefined) record.notes = data.notes;

  await record.save();

  return FinancialRecord.findById(record._id)
    .populate("userId", "name email")
    .populate("tags", "name color")
    .lean();
}

export async function softDeleteRecord(
  id: string,
  requestingUser: ReqUser
): Promise<{ message: string }> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid record ID");
  }

  const record = await FinancialRecord.findById(id);
  if (!record || record.isDeleted) {
    throw ApiError.notFound("Record not found");
  }

  if (requestingUser.role === "viewer") {
    throw ApiError.forbidden("Insufficient permissions");
  }

  if (requestingUser.role === "analyst") {
    throw ApiError.forbidden("Insufficient permissions");
  }

  record.isDeleted = true;
  record.deletedAt = new Date();
  await record.save();

  return { message: "Record deleted successfully" };
}

export async function restoreRecord(id: string): Promise<unknown> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid record ID");
  }

  const record = await FinancialRecord.findOne({ _id: id, isDeleted: true })
    .setOptions({ includeDeleted: true });

  if (!record) {
    throw ApiError.notFound("Deleted record not found");
  }

  record.isDeleted = false;
  record.deletedAt = undefined;
  await record.save();

  return FinancialRecord.findById(record._id)
    .populate("userId", "name email")
    .populate("tags", "name color")
    .lean();
}

// ---- Tag management ----

export async function createTag(
  data: { name: string; color?: string },
  createdBy: string
): Promise<unknown> {
  const name = data.name.toLowerCase().trim();

  const existing = await Tag.findOne({ name });
  if (existing) {
    throw ApiError.conflict("A tag with this name already exists");
  }

  const tag = await Tag.create({
    name,
    color: data.color ?? "#6366f1",
    createdBy: new mongoose.Types.ObjectId(createdBy),
  });

  return tag.toObject();
}

export async function getTags(): Promise<unknown[]> {
  return Tag.find().sort({ name: 1 }).lean();
}

export async function deleteTag(id: string): Promise<{ message: string }> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid tag ID");
  }

  const tag = await Tag.findById(id);
  if (!tag) {
    throw ApiError.notFound("Tag not found");
  }

  await FinancialRecord.updateMany(
    { tags: new mongoose.Types.ObjectId(id) },
    { $pull: { tags: new mongoose.Types.ObjectId(id) } }
  );

  await tag.deleteOne();

  return { message: "Tag deleted successfully" };
}
