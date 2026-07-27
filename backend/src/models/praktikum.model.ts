import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/db.js";
import type { Praktikum, PraktikumInput, StatusPraktikum } from "../types/praktikum.types.js";

interface PraktikumRow extends Praktikum, RowDataPacket {}
interface CountRow extends RowDataPacket {
  total: number;
}

export async function findAllPraktikum(): Promise<Praktikum[]> {
  const [rows] = await pool.query<PraktikumRow[]>(
    "SELECT * FROM praktikum ORDER BY created_at DESC"
  );
  return rows;
}

export async function findPraktikumById(id: number): Promise<Praktikum | null> {
  const [rows] = await pool.query<PraktikumRow[]>(
    "SELECT * FROM praktikum WHERE id_praktikum = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function insertPraktikum(
  data: PraktikumInput & { kode_akses: string; id_admin: number }
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO praktikum
      (id_admin, judul, mata_kuliah, deskripsi, bahasa, tingkat_kesulitan,
       instruksi, starter_code, contoh_input, contoh_output, durasi_menit,
       kode_akses, status, jadwal_mulai, jadwal_berakhir)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id_admin,
      data.judul,
      data.mata_kuliah,
      data.deskripsi ?? null,
      data.bahasa,
      data.tingkat_kesulitan,
      data.instruksi,
      data.starter_code ?? null,
      data.contoh_input ?? null,
      data.contoh_output ?? null,
      data.durasi_menit,
      data.kode_akses,
      data.status ?? "nonaktif",
      data.jadwal_mulai,
      data.jadwal_berakhir,
    ]
  );
  return result.insertId;
}

export async function updatePraktikumById(
  id: number,
  data: PraktikumInput & { kode_akses: string }
): Promise<void> {
  await pool.query(
    `UPDATE praktikum SET
      judul = ?, mata_kuliah = ?, deskripsi = ?, bahasa = ?, tingkat_kesulitan = ?,
      instruksi = ?, starter_code = ?, contoh_input = ?, contoh_output = ?,
      durasi_menit = ?, kode_akses = ?, jadwal_mulai = ?, jadwal_berakhir = ?
     WHERE id_praktikum = ?`,
    [
      data.judul,
      data.mata_kuliah,
      data.deskripsi ?? null,
      data.bahasa,
      data.tingkat_kesulitan,
      data.instruksi,
      data.starter_code ?? null,
      data.contoh_input ?? null,
      data.contoh_output ?? null,
      data.durasi_menit,
      data.kode_akses,
      data.jadwal_mulai,
      data.jadwal_berakhir,
      id,
    ]
  );
}

export async function updateStatusById(id: number, status: StatusPraktikum): Promise<void> {
  await pool.query("UPDATE praktikum SET status = ? WHERE id_praktikum = ?", [status, id]);
}

export async function deactivateAllExcept(id: number): Promise<void> {
  await pool.query(
    "UPDATE praktikum SET status = 'nonaktif' WHERE id_praktikum != ? AND status = 'aktif'",
    [id]
  );
}

export async function countPesertaByPraktikum(id: number): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    "SELECT COUNT(*) AS total FROM peserta WHERE id_praktikum = ?",
    [id]
  );
  return rows[0]?.total ?? 0;
}

export async function deletePraktikumById(id: number): Promise<void> {
  await pool.query("DELETE FROM praktikum WHERE id_praktikum = ?", [id]);
}

export async function isKodeAksesTaken(kodeAkses: string, excludeId?: number): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    excludeId
      ? "SELECT COUNT(*) AS total FROM praktikum WHERE kode_akses = ? AND id_praktikum != ?"
      : "SELECT COUNT(*) AS total FROM praktikum WHERE kode_akses = ?",
    excludeId ? [kodeAkses, excludeId] : [kodeAkses]
  );
  return (rows[0]?.total ?? 0) > 0;
}
