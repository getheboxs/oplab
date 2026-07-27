import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findAdminByUsername } from "../models/admin.model.js";
import type { AdminPublic } from "../types/admin.types.js";

interface LoginResult {
  token: string;
  admin: AdminPublic;
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<LoginResult | null> {
  const admin = await findAdminByUsername(username);
  if (!admin) return null;

  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
  if (!isPasswordValid) return null;

  const { password_hash, ...adminPublic } = admin;

  const token = jwt.sign(
    { id_admin: admin.id_admin, username: admin.username },
    process.env.JWT_SECRET ?? "dev_secret",
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? "8h") as jwt.SignOptions["expiresIn"] }
  );

  return { token, admin: adminPublic };
}
