import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/db.js";

export interface AdminRow extends RowDataPacket {
  id_admin: number;
  username: string;
  nama_lengkap: string;
  email: string | null;
  created_at: string;
}
interface CountRow extends RowDataPacket {
  total: number;
}

export async function findAllAdmins(): Promise<AdminRow[]> {
  const [rows] = await pool.query<AdminRow[]>(
    "SELECT id_admin, username, nama_lengkap, email, created_at FROM admins ORDER BY created_at DESC"
  );
  return rows;
}

export async function countAdmins(): Promise<number> {
  const [rows] = await pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM admins");
  return rows[0]?.total ?? 0;
}

export async function isUsernameTaken(username: string, excludeId?: number): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    excludeId
      ? "SELECT COUNT(*) AS total FROM admins WHERE username = ? AND id_admin != ?"
      : "SELECT COUNT(*) AS total FROM admins WHERE username = ?",
    excludeId ? [username, excludeId] : [username]
  );
  return (rows[0]?.total ?? 0) > 0;
}

export async function insertAdmin(data: {
  username: string;
  passwordHash: string;
  namaLengkap: string;
  email: string | null;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO admins (username, password_hash, nama_lengkap, email) VALUES (?, ?, ?, ?)",
    [data.username, data.passwordHash, data.namaLengkap, data.email]
  );
  return result.insertId;
}

export async function updateAdmin(
  id: number,
  data: { username: string; namaLengkap: string; email: string | null }
): Promise<void> {
  await pool.query(
    "UPDATE admins SET username = ?, nama_lengkap = ?, email = ? WHERE id_admin = ?",
    [data.username, data.namaLengkap, data.email, id]
  );
}

export async function updateAdminPassword(id: number, passwordHash: string): Promise<void> {
  await pool.query("UPDATE admins SET password_hash = ? WHERE id_admin = ?", [passwordHash, id]);
}

export async function deleteAdminById(id: number): Promise<void> {
  await pool.query("DELETE FROM admins WHERE id_admin = ?", [id]);
}

export async function findAdminByIdRow(id: number): Promise<AdminRow | null> {
  const [rows] = await pool.query<AdminRow[]>(
    "SELECT id_admin, username, nama_lengkap, email, created_at FROM admins WHERE id_admin = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}
