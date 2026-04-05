import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { ApiResponse } from "../utils/ApiResponse";
import { RegisterInput, LoginInput, UpdatePasswordInput } from "../schemas/auth.schema";

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body as RegisterInput);
  const response = ApiResponse.created(result, "Registration successful");
  res.status(response.statusCode).json(response);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginInput);
  const response = ApiResponse.success(result, "Login successful");
  res.status(response.statusCode).json(response);
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!._id);
  const response = ApiResponse.success(user, "User fetched");
  res.status(response.statusCode).json(response);
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as UpdatePasswordInput;
  await authService.changePassword(req.user!._id, currentPassword, newPassword);
  const response = ApiResponse.success(null, "Password changed successfully");
  res.status(response.statusCode).json(response);
}
