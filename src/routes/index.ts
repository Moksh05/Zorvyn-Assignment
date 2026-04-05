import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import recordRoutes from "./record.routes";
import tagRoutes from "./tag.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/records", recordRoutes);
router.use("/api/tags", tagRoutes);
router.use("/api/dashboard", dashboardRoutes);

export default router;
