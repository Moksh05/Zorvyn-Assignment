import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "analyst", "viewer"]).optional().default("viewer"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    email: z.string().email("Invalid email address").optional(),
    status: z.enum(["active", "inactive"]).optional(),
    role: z.enum(["admin", "analyst", "viewer"]).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.status !== undefined ||
      data.role !== undefined,
    { message: "At least one field must be provided" }
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
