import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service.js";

export async function summary(_req: Request, res: Response) {
  try {
    const data = await getDashboardSummary();
    res.status(200).json(data);
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ message: "Gagal memuat ringkasan statistik." });
  }
}
