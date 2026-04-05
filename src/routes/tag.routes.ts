import { Router } from "express";
import * as recordController from "../controllers/record.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name cannot exceed 50 characters"),
  color: z.string().optional(),
});

router.get("/", authenticate, asyncHandler(recordController.getTags));

router.post(
  "/",
  authenticate,
  authorize("admin", "analyst"),
  validate(createTagSchema),
  asyncHandler(recordController.createTag)
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(recordController.deleteTag)
);

export default router;
