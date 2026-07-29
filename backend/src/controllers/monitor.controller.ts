import { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { getMonitorList, getMonitorDetail } from "../services/monitor.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error("Monitor error:", error);
  return res.status(500).json({ message: "Terjadi kesalahan pada server." });
}

export async function list(req: Request, res: Response) {
  try {
    const search = (req.query.search as string) || undefined;
    const idPraktikum = req.query.id_praktikum ? Number(req.query.id_praktikum) : undefined;
    const status = (req.query.status as "mengerjakan" | "selesai") || undefined;

    const data = await getMonitorList({ search, idPraktikum, status });
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
}

export async function detail(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await getMonitorDetail(id);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
}
