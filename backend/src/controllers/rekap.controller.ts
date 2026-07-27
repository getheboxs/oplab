import { Request, Response } from "express";
import { findRekap } from "../models/rekap.model.js";

export async function list(req: Request, res: Response) {
  try {
    const idPraktikum = req.query.id_praktikum
      ? Number(req.query.id_praktikum)
      : undefined;
    const status = req.query.status as "mengerjakan" | "selesai" | undefined;

    const rows = await findRekap({
      idPraktikum: idPraktikum || undefined,
      status: status || undefined,
    });

    const data = rows.map((row) => {
      const mulai = new Date(row.waktu_mulai).getTime();
      const akhir = row.waktu_selesai ? new Date(row.waktu_selesai).getTime() : Date.now();
      const durasiDetik = Math.max(0, Math.round((akhir - mulai) / 1000));

      return {
        id_peserta: row.id_peserta,
        nim: row.nim,
        nama: row.nama,
        praktikum: row.praktikum_judul,
        waktu_mulai: row.waktu_mulai,
        jumlah_pelanggaran: row.total_pelanggaran,
        durasi_detik: durasiDetik,
        status: row.status,
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Rekap error:", error);
    res.status(500).json({ message: "Gagal memuat data rekapitulasi." });
  }
}
