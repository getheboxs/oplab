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
