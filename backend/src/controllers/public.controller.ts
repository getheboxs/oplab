import { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import {
  getAktifPraktikumPublic,
  registerPeserta,
  autosaveKode,
  recordViolation,
  submitPraktikum,
} from "../services/peserta.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error("Public error:", error);
  return res.status(500).json({ message: "Terjadi kesalahan pada server." });
}

export async function praktikumAktif(_req: Request, res: Response) {
  try {
    const data = await getAktifPraktikumPublic();
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
}

export async function daftarPeserta(req: Request, res: Response) {
  try {
    const { kode_akses, nim, nama } = req.body ?? {};
    const result = await registerPeserta({ kode_akses, nim, nama });
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
}

export async function autosave(req: Request, res: Response) {
  try {
    const idPeserta = Number(req.params.id);
    const { kode_program, output_terakhir } = req.body ?? {};
    if (kode_program === undefined) {
      return res.status(400).json({ message: "kode_program wajib diisi." });
    }
    await autosaveKode(idPeserta, kode_program, output_terakhir);
    res.status(200).json({ status: "ok" });
  } catch (error) {
    handleError(res, error);
  }
}

export async function catatPelanggaran(req: Request, res: Response) {
  try {
    const idPeserta = Number(req.params.id);
    const { jenis_pelanggaran } = req.body ?? {};
    if (!jenis_pelanggaran) {
      return res.status(400).json({ message: "jenis_pelanggaran wajib diisi." });
    }
    await recordViolation(idPeserta, jenis_pelanggaran);
    res.status(201).json({ status: "ok" });
  } catch (error) {
    handleError(res, error);
  }
}

export async function kirimPraktikum(req: Request, res: Response) {
  try {
    const idPeserta = Number(req.params.id);
    const { kode_program, submit_type } = req.body ?? {};
    if (!kode_program) {
      return res.status(400).json({ message: "kode_program wajib diisi." });
    }
    const result = await submitPraktikum(
      idPeserta,
      kode_program,
      submit_type === "auto" ? "auto" : "manual"
    );
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
}
