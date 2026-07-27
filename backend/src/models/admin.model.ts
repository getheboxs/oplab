import { RowDataPacket } from "mysql2";
import { pool } from "../config/db.js";
import type { Admin } from "../types/admin.types.js";

interface AdminRow extends Admin, RowDataPacket {}

export async function findAdminByUsername(username: string): Promise<Admin | null> {
  const [rows] = await pool.query<AdminRow[]>(
    "SELECT id_admin, username, password_hash, nama_lengkap, email FROM admins WHERE username = ? LIMIT 1",
    [username]
  );

  return rows[0] ?? null;
}
