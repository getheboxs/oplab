import { Router } from "express";
import {
  praktikumAktif,
  daftarPeserta,
  catatPelanggaran,
  kirimPraktikum,
} from "../controllers/public.controller.js";

const router = Router();

// GET  /api/public/praktikum/aktif
// POST /api/public/peserta
// POST /api/public/peserta/:id/violation
// POST /api/public/peserta/:id/submission
router.get("/praktikum/aktif", praktikumAktif);
router.post("/peserta", daftarPeserta);
router.post("/peserta/:id/violation", catatPelanggaran);
router.post("/peserta/:id/submission", kirimPraktikum);

export default router;
