import { pool } from "../config/db.js";
import type { Admin } from "../types/admin.types.js";

export async function findAdminByUsername(username: string): Promise<Admin | null> {
  const [rows] = await pool.query<Admin[]>(
    "SELECT id_admin, username, password_hash, nama_lengkap, email FROM admins WHERE username = $1 LIMIT 1",
    [username]
  );

  return rows[0] ?? null;
}
