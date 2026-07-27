import { Request, Response } from "express";
import { loginAdmin } from "../services/auth.service.js";

export async function login(req: Request, res: Response) {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi." });
  }

  try {
    const result = await loginAdmin(username, password);

    if (!result) {
      return res.status(401).json({ message: "Username atau password salah." });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}
