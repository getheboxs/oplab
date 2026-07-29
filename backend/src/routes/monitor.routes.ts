import { Router } from "express";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { list, detail } from "../controllers/monitor.controller.js";

const router = Router();

router.use(requireAdminAuth);

// GET /api/admin/monitor?search=&id_praktikum=&status=
// GET /api/admin/monitor/:id
router.get("/", list);
router.get("/:id", detail);

export default router;
