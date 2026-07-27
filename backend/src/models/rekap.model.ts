import { RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface RekapRow extends RowDataPacket {
  id_peserta: number;
  nim: string;
  nama: string;
  status: "mengerjakan" | "selesai";
  waktu_mulai: string;
  waktu_selesai: string | null;
  id_praktikum: number;
  praktikum_judul: string;
  total_pelanggaran: number;
  durasi_pengerjaan_detik: number | null;
}

export interface RekapFilter {
  idPraktikum?: number;
  status?: "mengerjakan" | "selesai";
}

export async function findRekap(filter: RekapFilter): Promise<RekapRow[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter.idPraktikum) {
    conditions.push("p.id_praktikum = ?");
    params.push(filter.idPraktikum);
  }
  if (filter.status) {
    conditions.push("p.status = ?");
    params.push(filter.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query<RekapRow[]>(
    `SELECT
        p.id_peserta,
        p.nim,
        p.nama,
        p.status,
        p.waktu_mulai,
        p.waktu_selesai,
        p.id_praktikum,
        pr.judul AS praktikum_judul,
        COALESCE(v.total_violation, 0) AS total_pelanggaran,
        s.durasi_pengerjaan_detik
      FROM peserta p
      INNER JOIN praktikum pr ON pr.id_praktikum = p.id_praktikum
      LEFT JOIN submission s ON s.id_peserta = p.id_peserta
      LEFT JOIN (
        SELECT id_peserta, COUNT(*) AS total_violation
        FROM violation_log
        GROUP BY id_peserta
      ) v ON v.id_peserta = p.id_peserta
      ${whereClause}
      ORDER BY p.waktu_mulai DESC`,
    params
  );

  return rows;
}
