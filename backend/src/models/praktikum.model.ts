import { pool } from "../config/db.js";
import type { Praktikum, PraktikumInput, StatusPraktikum } from "../types/praktikum.types.js";

interface CountRow {
  total: number;
}

export async function findAllPraktikum(): Promise<Praktikum[]> {
  const [rows] = await pool.query<Praktikum[]>(
    "SELECT * FROM praktikum ORDER BY created_at DESC"
  );
  return rows;
}

export async function findActivePraktikum(): Promise<Praktikum | null> {
  const [rows] = await pool.query<Praktikum[]>(
    "SELECT * FROM praktikum WHERE status = 'aktif' LIMIT 1"
  );
  return rows[0] ?? null;
}

export async function findPraktikumById(id: number): Promise<Praktikum | null> {
  const [rows] = await pool.query<Praktikum[]>(
    "SELECT * FROM praktikum WHERE id_praktikum = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}

export async function insertPraktikum(
  data: PraktikumInput & { kode_akses: string; id_admin: number }
): Promise<number> {
  const [rows, meta] = await pool.query<{ id_praktikum: number }[]>(
    `INSERT INTO praktikum
      (id_admin, judul, mata_kuliah, deskripsi, bahasa, tingkat_kesulitan,
       instruksi, starter_code, contoh_input, contoh_output, durasi_menit,
       kode_akses, status, jadwal_mulai, jadwal_berakhir)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING id_praktikum`,
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
  return rows[0]?.id_praktikum ?? meta.insertId;
}

export async function updatePraktikumById(
  id: number,
  data: PraktikumInput & { kode_akses: string }
): Promise<void> {
  await pool.query(
    `UPDATE praktikum SET
      judul = $1, mata_kuliah = $2, deskripsi = $3, bahasa = $4, tingkat_kesulitan = $5,
      instruksi = $6, starter_code = $7, contoh_input = $8, contoh_output = $9,
      durasi_menit = $10, kode_akses = $11, jadwal_mulai = $12, jadwal_berakhir = $13
     WHERE id_praktikum = $14`,
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
  await pool.query("UPDATE praktikum SET status = $1 WHERE id_praktikum = $2", [status, id]);
}

export async function deactivateAllExcept(id: number): Promise<void> {
  await pool.query(
    "UPDATE praktikum SET status = 'nonaktif' WHERE id_praktikum != $1 AND status = 'aktif'",
    [id]
  );
}

export async function countPesertaByPraktikum(id: number): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    "SELECT COUNT(*) AS total FROM peserta WHERE id_praktikum = $1",
    [id]
  );
  return Number(rows[0]?.total ?? 0);
}

export async function deletePraktikumById(id: number): Promise<void> {
  await pool.query("DELETE FROM praktikum WHERE id_praktikum = $1", [id]);
}

export async function isKodeAksesTaken(kodeAkses: string, excludeId?: number): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    excludeId
      ? "SELECT COUNT(*) AS total FROM praktikum WHERE LOWER(kode_akses) = LOWER($1) AND id_praktikum != $2"
      : "SELECT COUNT(*) AS total FROM praktikum WHERE LOWER(kode_akses) = LOWER($1)",
    excludeId ? [kodeAkses, excludeId] : [kodeAkses]
  );
  return Number(rows[0]?.total ?? 0) > 0;
}
