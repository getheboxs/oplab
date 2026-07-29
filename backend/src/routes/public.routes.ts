import { Router } from "express";
import {
  praktikumAktif,
  daftarPeserta,
  autosave,
  catatPelanggaran,
  kirimPraktikum,
} from "../controllers/public.controller.js";

const router = Router();

// GET   /api/public/praktikum/aktif
// POST  /api/public/peserta
// PATCH /api/public/peserta/:id/autosave
// POST  /api/public/peserta/:id/violation
// POST  /api/public/peserta/:id/submission
router.get("/praktikum/aktif", praktikumAktif);
router.post("/peserta", daftarPeserta);
router.patch("/peserta/:id/autosave", autosave);
router.post("/peserta/:id/violation", catatPelanggaran);
router.post("/peserta/:id/submission", kirimPraktikum);

export default router;
