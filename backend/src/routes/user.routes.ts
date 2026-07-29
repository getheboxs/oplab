import { Router } from "express";
import { requireAdminAuth } from "../middlewares/auth.middleware.js";
import { list, create, update, remove } from "../controllers/user.controller.js";

const router = Router();

router.use(requireAdminAuth);

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
