import { Router } from "express";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import {
  list,
  create,
  update,
  updateStatus,
  remove,
} from "../controllers/praktikum.controller.js";

const router = Router();

router.use(requireAdminAuth);

// GET    /api/admin/praktikum
// POST   /api/admin/praktikum
// PUT    /api/admin/praktikum/:id
// PATCH  /api/admin/praktikum/:id/status
// DELETE /api/admin/praktikum/:id
router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.patch("/:id/status", updateStatus);
router.delete("/:id", remove);

export default router;
