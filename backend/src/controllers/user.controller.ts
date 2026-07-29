import { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { listUsers, createUser, updateUser, removeUser } from "../services/user.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error("User error:", error);
  return res.status(500).json({ message: "Terjadi kesalahan pada server." });
}

export async function list(_req: Request, res: Response) {
  try {
    const data = await listUsers();
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const created = await createUser(req.body ?? {});
    res.status(201).json(created);
  } catch (error) {
    handleError(res, error);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const updated = await updateUser(id, req.body ?? {});
    res.status(200).json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const requesterId = req.admin!.id_admin;
    await removeUser(id, requesterId);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
