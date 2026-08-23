import { pool } from "../config/db.js";

export interface MonitorListRow {
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
  let paramIndex = 1;

  if (filter.search) {
    conditions.push(`(p.nama ILIKE $${paramIndex} OR p.nim ILIKE $${paramIndex + 1})`);
    params.push(`%${filter.search}%`, `%${filter.search}%`);
    paramIndex += 2;
  }
  if (filter.idPraktikum) {
    conditions.push(`p.id_praktikum = $${paramIndex}`);
    params.push(filter.idPraktikum);
    paramIndex += 1;
  }
  if (filter.status) {
    conditions.push(`p.status = $${paramIndex}`);
    params.push(filter.status);
    paramIndex += 1;
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

export interface MonitorDetailRow {
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
     WHERE p.id_peserta = $1
     LIMIT 1`,
    [idPeserta]
  );
  return rows[0] ?? null;
}

export interface SubmissionRow {
  kode_program: string;
  durasi_pengerjaan_detik: number | null;
}

export async function findSubmissionByPeserta(idPeserta: number): Promise<SubmissionRow | null> {
  const [rows] = await pool.query<SubmissionRow[]>(
    "SELECT kode_program, durasi_pengerjaan_detik FROM submission WHERE id_peserta = $1 LIMIT 1",
    [idPeserta]
  );
  return rows[0] ?? null;
}

export interface ViolationRow {
  id_violation: number;
  jenis_pelanggaran: string;
  waktu_terjadi: string;
}

export async function findViolationsByPeserta(idPeserta: number): Promise<ViolationRow[]> {
  const [rows] = await pool.query<ViolationRow[]>(
    `SELECT id_violation, jenis_pelanggaran, waktu_terjadi
     FROM violation_log WHERE id_peserta = $1 ORDER BY waktu_terjadi DESC`,
    [idPeserta]
  );
  return rows;
}
