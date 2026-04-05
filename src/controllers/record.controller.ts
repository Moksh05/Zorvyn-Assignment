import { Request, Response } from "express";
import * as recordService from "../services/record.service";
import { ApiResponse } from "../utils/ApiResponse";
import { CreateRecordInput, UpdateRecordInput, RecordFilterInput } from "../schemas/record.schema";

export async function createRecord(req: Request, res: Response): Promise<void> {
  const record = await recordService.createRecord(
    req.user!._id,
    req.body as CreateRecordInput
  );
  const response = ApiResponse.created(record, "Record created successfully");
  res.status(response.statusCode).json(response);
}

export async function getRecords(req: Request, res: Response): Promise<void> {
  const filters = req.query as unknown as RecordFilterInput;
  const result = await recordService.getRecords(req.user!, filters);
  const response = ApiResponse.success(result, "Records fetched successfully");
  res.status(response.statusCode).json(response);
}

export async function getRecordById(req: Request, res: Response): Promise<void> {
  const record = await recordService.getRecordById(
    req.params["id"] as string,
    req.user!
  );
  const response = ApiResponse.success(record, "Record fetched successfully");
  res.status(response.statusCode).json(response);
}

export async function updateRecord(req: Request, res: Response): Promise<void> {
  const record = await recordService.updateRecord(
    req.params["id"] as string,
    req.user!,
    req.body as UpdateRecordInput
  );
  const response = ApiResponse.success(record, "Record updated successfully");
  res.status(response.statusCode).json(response);
}

export async function softDeleteRecord(req: Request, res: Response): Promise<void> {
  const result = await recordService.softDeleteRecord(
    req.params["id"] as string,
    req.user!
  );
  const response = ApiResponse.success(result, result.message);
  res.status(response.statusCode).json(response);
}

export async function restoreRecord(req: Request, res: Response): Promise<void> {
  const record = await recordService.restoreRecord(req.params["id"] as string);
  const response = ApiResponse.success(record, "Record restored successfully");
  res.status(response.statusCode).json(response);
}

export async function getTags(_req: Request, res: Response): Promise<void> {
  const tags = await recordService.getTags();
  const response = ApiResponse.success(tags, "Tags fetched successfully");
  res.status(response.statusCode).json(response);
}

export async function createTag(req: Request, res: Response): Promise<void> {
  const tag = await recordService.createTag(
    req.body as { name: string; color?: string },
    req.user!._id
  );
  const response = ApiResponse.created(tag, "Tag created successfully");
  res.status(response.statusCode).json(response);
}

export async function deleteTag(req: Request, res: Response): Promise<void> {
  const result = await recordService.deleteTag(req.params["id"] as string);
  const response = ApiResponse.success(result, result.message);
  res.status(response.statusCode).json(response);
}
