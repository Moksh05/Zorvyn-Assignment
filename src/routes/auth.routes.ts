import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/authenticate";
import { registerSchema, loginSchema, updatePasswordSchema } from "../schemas/auth.schema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(authController.register));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));
router.get("/me", authenticate, asyncHandler(authController.getMe));
router.patch(
  "/change-password",
  authenticate,
  validate(updatePasswordSchema),
  asyncHandler(authController.changePassword)
);

export default router;
