import { Router } from "express";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { summary } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(requireAdminAuth);

// GET /api/admin/dashboard/summary
router.get("/summary", summary);

export default router;
