import { pool } from "../config/db.js";

export interface AdminRow {
  id_admin: number;
  username: string;
  nama_lengkap: string;
  email: string | null;
  created_at: string;
}

interface CountRow {
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
  return Number(rows[0]?.total ?? 0);
}

export async function isUsernameTaken(username: string, excludeId?: number): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    excludeId
      ? "SELECT COUNT(*) AS total FROM admins WHERE LOWER(username) = LOWER($1) AND id_admin != $2"
      : "SELECT COUNT(*) AS total FROM admins WHERE LOWER(username) = LOWER($1)",
    excludeId ? [username, excludeId] : [username]
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

export async function insertAdmin(data: {
  username: string;
  passwordHash: string;
  namaLengkap: string;
  email: string | null;
}): Promise<number> {
  const [rows, meta] = await pool.query<{ id_admin: number }[]>(
    "INSERT INTO admins (username, password_hash, nama_lengkap, email) VALUES ($1, $2, $3, $4) RETURNING id_admin",
    [data.username, data.passwordHash, data.namaLengkap, data.email]
  );
  return rows[0]?.id_admin ?? meta.insertId;
}

export async function updateAdmin(
  id: number,
  data: { username: string; namaLengkap: string; email: string | null }
): Promise<void> {
  await pool.query(
    "UPDATE admins SET username = $1, nama_lengkap = $2, email = $3 WHERE id_admin = $4",
    [data.username, data.namaLengkap, data.email, id]
  );
}

export async function updateAdminPassword(id: number, passwordHash: string): Promise<void> {
  await pool.query("UPDATE admins SET password_hash = $1 WHERE id_admin = $2", [passwordHash, id]);
}

export async function deleteAdminById(id: number): Promise<void> {
  await pool.query("DELETE FROM admins WHERE id_admin = $1", [id]);
}

export async function findAdminByIdRow(id: number): Promise<AdminRow | null> {
  const [rows] = await pool.query<AdminRow[]>(
    "SELECT id_admin, username, nama_lengkap, email, created_at FROM admins WHERE id_admin = $1 LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}
