import { Router } from "express";
import * as recordController from "../controllers/record.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate, validateQuery } from "../middlewares/validate";
import { createRecordSchema, updateRecordSchema, recordFilterSchema } from "../schemas/record.schema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All record routes require authentication
router.use(authenticate);

router.post(
  "/",
  authorize("admin", "analyst"),
  validate(createRecordSchema),
  asyncHandler(recordController.createRecord)
);

router.get(
  "/",
  validateQuery(recordFilterSchema),
  asyncHandler(recordController.getRecords)
);

router.get("/:id", asyncHandler(recordController.getRecordById));

router.patch(
  "/:id/restore",
  authorize("admin"),
  asyncHandler(recordController.restoreRecord)
);

router.patch(
  "/:id",
  authorize("admin", "analyst"),
  validate(updateRecordSchema),
  asyncHandler(recordController.updateRecord)
);

router.delete(
  "/:id",
  authorize("admin"),
  asyncHandler(recordController.softDeleteRecord)
);

export default router;
