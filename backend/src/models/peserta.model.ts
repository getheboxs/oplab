import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/db.js";
import type { Praktikum } from "../types/praktikum.types.js";

interface PraktikumRow extends Praktikum, RowDataPacket {}
interface PesertaRow extends RowDataPacket {
  id_peserta: number;
  waktu_mulai: string;
}

export async function findPraktikumByKodeAkses(kodeAkses: string): Promise<Praktikum | null> {
  const [rows] = await pool.query<PraktikumRow[]>(
    "SELECT * FROM praktikum WHERE kode_akses = ? LIMIT 1",
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
  const [rows] = await pool.query<(PesertaDetail & RowDataPacket)[]>(
    "SELECT id_peserta, id_praktikum, waktu_mulai, status FROM peserta WHERE id_peserta = ? LIMIT 1",
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
      `UPDATE peserta SET kode_terkini = ?, output_terakhir = ?, kode_updated_at = NOW()
       WHERE id_peserta = ?`,
      [kodeProgram, outputTerakhir, idPeserta]
    );
  } else {
    await pool.query(
      `UPDATE peserta SET kode_terkini = ?, kode_updated_at = NOW() WHERE id_peserta = ?`,
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
     VALUES (?, ?, ?, NOW())`,
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
     VALUES (?, ?, ?, NOW())`,
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
     VALUES (?, ?, NOW(), ?, ?)`,
    [idPeserta, kodeProgram, durasiDetik, submitType]
  );
  await pool.query("UPDATE peserta SET status = 'selesai', waktu_selesai = NOW() WHERE id_peserta = ?", [
    idPeserta,
  ]);
}
export async function insertPeserta(data: {
  id_praktikum: number;
  nim: string;
  nama: string;
}): Promise<{ id_peserta: number; waktu_mulai: string }> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO peserta (id_praktikum, nim, nama, waktu_mulai, status)
     VALUES (?, ?, ?, NOW(), 'mengerjakan')`,
    [data.id_praktikum, data.nim, data.nama]
  );

  const [rows] = await pool.query<PesertaRow[]>(
    "SELECT id_peserta, waktu_mulai FROM peserta WHERE id_peserta = ?",
    [result.insertId]
  );

  return { id_peserta: rows[0].id_peserta, waktu_mulai: rows[0].waktu_mulai };
}
