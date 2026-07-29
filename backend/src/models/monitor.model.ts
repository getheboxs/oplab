import { RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";

export interface MonitorListRow extends RowDataPacket {
  id_peserta: number;
  nim: string;
  nama: string;
  status: "mengerjakan" | "selesai";
  id_praktikum: number;
  praktikum_judul: string;
  waktu_mulai: string;
  waktu_selesai: string | null;
  kode_updated_at: string | null;
  total_pelanggaran: number;
}

export interface MonitorFilter {
  search?: string;
  idPraktikum?: number;
  status?: "mengerjakan" | "selesai";
}

export async function findMonitorList(filter: MonitorFilter): Promise<MonitorListRow[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter.search) {
    conditions.push("(p.nama LIKE ? OR p.nim LIKE ?)");
    params.push(`%${filter.search}%`, `%${filter.search}%`);
  }
  if (filter.idPraktikum) {
    conditions.push("p.id_praktikum = ?");
    params.push(filter.idPraktikum);
  }
  if (filter.status) {
    conditions.push("p.status = ?");
    params.push(filter.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query<MonitorListRow[]>(
    `SELECT
        p.id_peserta, p.nim, p.nama, p.status,
        p.id_praktikum, pr.judul AS praktikum_judul,
        p.waktu_mulai, p.waktu_selesai, p.kode_updated_at,
        (SELECT COUNT(*) FROM violation_log v WHERE v.id_peserta = p.id_peserta) AS total_pelanggaran
     FROM peserta p
     JOIN praktikum pr ON p.id_praktikum = pr.id_praktikum
     ${whereClause}
     ORDER BY COALESCE(p.kode_updated_at, p.waktu_mulai) DESC`,
    params
  );

  return rows;
}

export interface MonitorDetailRow extends RowDataPacket {
  id_peserta: number;
  nim: string;
  nama: string;
  status: "mengerjakan" | "selesai";
  waktu_mulai: string;
  waktu_selesai: string | null;
  praktikum_judul: string;
  bahasa: "javascript" | "typescript";
  kode_terkini: string | null;
  output_terakhir: string | null;
  total_pelanggaran: number;
}

export async function findMonitorDetail(idPeserta: number): Promise<MonitorDetailRow | null> {
  const [rows] = await pool.query<MonitorDetailRow[]>(
    `SELECT
        p.id_peserta, p.nim, p.nama, p.status, p.waktu_mulai, p.waktu_selesai,
        pr.judul AS praktikum_judul, pr.bahasa,
        p.kode_terkini, p.output_terakhir,
        (SELECT COUNT(*) FROM violation_log v WHERE v.id_peserta = p.id_peserta) AS total_pelanggaran
     FROM peserta p
     JOIN praktikum pr ON p.id_praktikum = pr.id_praktikum
     WHERE p.id_peserta = ?
     LIMIT 1`,
    [idPeserta]
  );
  return rows[0] ?? null;
}

export interface SubmissionRow extends RowDataPacket {
  kode_program: string;
  durasi_pengerjaan_detik: number | null;
}

export async function findSubmissionByPeserta(idPeserta: number): Promise<SubmissionRow | null> {
  const [rows] = await pool.query<SubmissionRow[]>(
    "SELECT kode_program, durasi_pengerjaan_detik FROM submission WHERE id_peserta = ? LIMIT 1",
    [idPeserta]
  );
  return rows[0] ?? null;
}

export interface ViolationRow extends RowDataPacket {
  id_violation: number;
  jenis_pelanggaran: string;
  waktu_terjadi: string;
}

export async function findViolationsByPeserta(idPeserta: number): Promise<ViolationRow[]> {
  const [rows] = await pool.query<ViolationRow[]>(
    `SELECT id_violation, jenis_pelanggaran, waktu_terjadi
     FROM violation_log WHERE id_peserta = ? ORDER BY waktu_terjadi DESC`,
    [idPeserta]
  );
  return rows;
}
