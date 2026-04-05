import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.post(
  "/",
  authorize("admin"),
  validate(createUserSchema),
  asyncHandler(userController.createUser)
);

router.get(
  "/",
  authorize("admin", "analyst"),
  asyncHandler(userController.getUsers)
);

router.get(
  "/:id/stats",
  authorize("admin", "analyst"),
  asyncHandler(userController.getUserStats)
);

router.get(
  "/:id",
  authorize("admin", "analyst"),
  asyncHandler(userController.getUserById)
);

router.patch(
  "/:id",
  authorize("admin"),
  validate(updateUserSchema),
  asyncHandler(userController.updateUser)
);

router.delete(
  "/:id",
  authorize("admin"),
  asyncHandler(userController.deleteUser)
);

export default router;
