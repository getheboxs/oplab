import { Router } from "express";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { list } from "../controllers/rekap.controller.js";

const router = Router();

router.use(requireAdminAuth);

// GET /api/admin/rekap?id_praktikum=&status=
router.get("/", list);

export default router;
