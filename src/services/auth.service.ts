import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

interface TokenPayload {
  _id: string;
  role: string;
  status: string;
}

function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export async function register(
  data: RegisterInput
): Promise<{ user: Record<string, unknown>; token: string }> {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
  });

  const token = generateToken({
    _id: user._id.toString(),
    role: user.role,
    status: user.status,
  });

  return { user: user.toSafeObject(), token };
}

export async function login(
  data: LoginInput
): Promise<{ user: Record<string, unknown>; token: string }> {
  const user = await User.findOne({ email: data.email }).select("+password");

  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (user.status === "inactive") {
    throw ApiError.forbidden("Account is inactive");
  }

  const isPasswordCorrect = await user.comparePassword(data.password);
  if (!isPasswordCorrect) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const token = generateToken({
    _id: user._id.toString(),
    role: user.role,
    status: user.status,
  });

  return { user: user.toSafeObject(), token };
}

export async function getMe(userId: string): Promise<Record<string, unknown>> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user.toSafeObject();
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return { message: "Password changed successfully" };
}
