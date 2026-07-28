import { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { getAktifPraktikumPublic, registerPeserta } from "../services/peserta.service.js";

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
