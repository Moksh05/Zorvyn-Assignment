import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { ApiResponse } from "../utils/ApiResponse";
import { CreateUserInput, UpdateUserInput } from "../schemas/user.schema";

export async function createUser(req: Request, res: Response): Promise<void> {
  const user = await userService.createUser(req.body as CreateUserInput);
  const response = ApiResponse.created(user, "User created successfully");
  res.status(response.statusCode).json(response);
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  const page = Number(req.query["page"]) || 1;
  const limit = Number(req.query["limit"]) || 10;
  const status = req.query["status"] as string | undefined;
  const role = req.query["role"] as string | undefined;
  const search = req.query["search"] as string | undefined;

  const result = await userService.getUsers({ page, limit, status, role, search });
  const response = ApiResponse.success(result, "Users fetched successfully");
  res.status(response.statusCode).json(response);
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(req.params["id"] as string);
  const response = ApiResponse.success(user, "User fetched successfully");
  res.status(response.statusCode).json(response);
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const user = await userService.updateUser(
    req.params["id"] as string,
    req.body as UpdateUserInput
  );
  const response = ApiResponse.success(user, "User updated successfully");
  res.status(response.statusCode).json(response);
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  await userService.deleteUser(req.params["id"] as string);
  const response = ApiResponse.success(null, "User deactivated successfully");
  res.status(response.statusCode).json(response);
}

export async function getUserStats(req: Request, res: Response): Promise<void> {
  const stats = await userService.getUserStats(req.params["id"] as string);
  const response = ApiResponse.success(stats, "User stats fetched successfully");
  res.status(response.statusCode).json(response);
}
