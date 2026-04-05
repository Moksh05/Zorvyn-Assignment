import { z } from "zod";

export const createRecordSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be positive")
    .gt(0, "Amount must be greater than 0"),
  type: z.enum(["income", "expense"], {
    required_error: "Type is required",
    invalid_type_error: "Type must be income or expense",
  }),
  category: z
    .string({ required_error: "Category is required" })
    .min(1, "Category is required")
    .max(100, "Category cannot exceed 100 characters"),
  date: z.coerce.date().optional().default(() => new Date()),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const updateRecordSchema = z
  .object({
    amount: z.number().positive("Amount must be positive").gt(0).optional(),
    type: z.enum(["income", "expense"]).optional(),
    category: z
      .string()
      .min(1, "Category is required")
      .max(100, "Category cannot exceed 100 characters")
      .optional(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  })
  .refine(
    (data) =>
      data.amount !== undefined ||
      data.type !== undefined ||
      data.category !== undefined ||
      data.date !== undefined ||
      data.tags !== undefined ||
      data.notes !== undefined,
    { message: "At least one field must be provided for update" }
  );

export const recordFilterSchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(10),
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  userId: z.string().optional(),
  sortBy: z.enum(["date", "amount", "category"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const dashboardFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  userId: z.string().optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordFilterInput = z.infer<typeof recordFilterSchema>;
export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;
