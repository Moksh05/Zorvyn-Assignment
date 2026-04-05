import { Router } from "express";
import * as dashController from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

router.get("/summary", asyncHandler(dashController.getSummary));
router.get("/monthly", asyncHandler(dashController.getMonthlyExpenditure));
router.get("/categories", asyncHandler(dashController.getCategoryBreakdown));
router.get("/category-trends", asyncHandler(dashController.getCategoryByMonth));

router.get(
  "/user-stats",
  authorize("admin", "analyst"),
  asyncHandler(dashController.getPerUserStats)
);

router.get(
  "/user-category/:userId",
  authorize("admin", "analyst"),
  asyncHandler(dashController.getPerUserCategoryBreakdown)
);

export default router;
