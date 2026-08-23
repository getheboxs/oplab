import { pool } from "../config/db.js";
import type { Praktikum } from "../types/praktikum.types.js";

export async function findPraktikumByKodeAkses(kodeAkses: string): Promise<Praktikum | null> {
  const [rows] = await pool.query<Praktikum[]>(
    "SELECT * FROM praktikum WHERE LOWER(kode_akses) = LOWER($1) LIMIT 1",
    [kodeAkses]
  );
  return rows[0] ?? null;
}

export interface PesertaDetail {
  id_peserta: number;
  id_praktikum: number;
  waktu_mulai: string;
  status: "mengerjakan" | "selesai";
}

export async function findPesertaById(id: number): Promise<PesertaDetail | null> {
  const [rows] = await pool.query<PesertaDetail[]>(
    "SELECT id_peserta, id_praktikum, waktu_mulai, status FROM peserta WHERE id_peserta = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function updateAutosave(
  idPeserta: number,
  kodeProgram: string,
  outputTerakhir?: string
): Promise<void> {
  if (outputTerakhir !== undefined) {
    await pool.query(
      `UPDATE peserta SET kode_terkini = $1, output_terakhir = $2, kode_updated_at = CURRENT_TIMESTAMP
       WHERE id_peserta = $3`,
      [kodeProgram, outputTerakhir, idPeserta]
    );
  } else {
    await pool.query(
      `UPDATE peserta SET kode_terkini = $1, kode_updated_at = CURRENT_TIMESTAMP WHERE id_peserta = $2`,
      [kodeProgram, idPeserta]
    );
  }
}

export async function insertViolationLog(
  idPeserta: number,
  jenisPelanggaran: string,
  keterangan?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO violation_log (id_peserta, jenis_pelanggaran, keterangan, waktu_terjadi)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
    [idPeserta, jenisPelanggaran, keterangan ?? null]
  );
}

export async function insertActivityLog(
  idPeserta: number,
  jenisAktivitas: string,
  keterangan?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO activity_log (id_peserta, jenis_aktivitas, keterangan, waktu_terjadi)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
    [idPeserta, jenisAktivitas, keterangan ?? null]
  );
}

export async function insertSubmission(
  idPeserta: number,
  kodeProgram: string,
  submitType: "manual" | "auto",
  durasiDetik: number
): Promise<void> {
  await pool.query(
    `INSERT INTO submission (id_peserta, kode_program, waktu_submit, durasi_pengerjaan_detik, submit_type)
     VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)`,
    [idPeserta, kodeProgram, durasiDetik, submitType]
  );
  await pool.query(
    "UPDATE peserta SET status = 'selesai', waktu_selesai = CURRENT_TIMESTAMP WHERE id_peserta = $1",
    [idPeserta]
  );
}

export async function insertPeserta(data: {
  id_praktikum: number;
  nim: string;
  nama: string;
}): Promise<{ id_peserta: number; waktu_mulai: string }> {
  const [rows] = await pool.query<{ id_peserta: number; waktu_mulai: string }[]>(
    `INSERT INTO peserta (id_praktikum, nim, nama, waktu_mulai, status)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'mengerjakan')
     RETURNING id_peserta, waktu_mulai`,
    [data.id_praktikum, data.nim, data.nama]
  );

  return { id_peserta: rows[0].id_peserta, waktu_mulai: rows[0].waktu_mulai };
}
