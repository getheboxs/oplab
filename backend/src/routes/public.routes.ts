import { Router } from "express";
import { praktikumAktif, daftarPeserta } from "../controllers/public.controller.js";

const router = Router();

// GET  /api/public/praktikum/aktif
// POST /api/public/peserta
router.get("/praktikum/aktif", praktikumAktif);
router.post("/peserta", daftarPeserta);

export default router;
