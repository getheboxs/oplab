import { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import {
  listPraktikum,
  createPraktikum,
  updatePraktikum,
  setPraktikumStatus,
  removePraktikum,
} from "../services/praktikum.service.js";
import type { PraktikumInput, StatusPraktikum } from "../types/praktikum.types.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error("Praktikum error:", error);
  return res.status(500).json({ message: "Terjadi kesalahan pada server." });
}

export async function list(_req: Request, res: Response) {
  try {
    const data = await listPraktikum();
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const idAdmin = req.admin!.id_admin;
    const input = req.body as PraktikumInput;
    const created = await createPraktikum(input, idAdmin);
    res.status(201).json(created);
  } catch (error) {
    handleError(res, error);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const input = req.body as PraktikumInput;
    const updated = await updatePraktikum(id, input);
    res.status(200).json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: StatusPraktikum };

    if (status !== "aktif" && status !== "nonaktif") {
      return res.status(400).json({ message: "Status tidak valid." });
    }

    const updated = await setPraktikumStatus(id, status);
    res.status(200).json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await removePraktikum(id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
