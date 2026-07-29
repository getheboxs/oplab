import bcrypt from "bcryptjs";
import { AppError } from "../utils/AppError.js";
import {
  findAllAdmins,
  countAdmins,
  isUsernameTaken,
  insertAdmin,
  updateAdmin,
  updateAdminPassword,
  deleteAdminById,
  findAdminByIdRow,
} from "../models/user.model.js";

export interface UserInput {
  username: string;
  nama_lengkap: string;
  email?: string | null;
  password?: string;
}

export async function listUsers() {
  return findAllAdmins();
}

export async function createUser(input: UserInput) {
  if (!input.username?.trim()) throw new AppError("Username wajib diisi.", 400);
  if (!input.nama_lengkap?.trim()) throw new AppError("Nama lengkap wajib diisi.", 400);
  if (!input.password || input.password.length < 6) {
    throw new AppError("Password wajib diisi, minimal 6 karakter.", 400);
  }

  const taken = await isUsernameTaken(input.username.trim());
  if (taken) throw new AppError("Username sudah digunakan.", 409);

  const passwordHash = bcrypt.hashSync(input.password, 10);
  const id = await insertAdmin({
    username: input.username.trim(),
    passwordHash,
    namaLengkap: input.nama_lengkap.trim(),
    email: input.email?.trim() || null,
  });

  const created = await findAdminByIdRow(id);
  if (!created) throw new AppError("Gagal membuat akun.", 500);
  return created;
}

export async function updateUser(id: number, input: UserInput) {
  const existing = await findAdminByIdRow(id);
  if (!existing) throw new AppError("Akun tidak ditemukan.", 404);

  if (!input.username?.trim()) throw new AppError("Username wajib diisi.", 400);
  if (!input.nama_lengkap?.trim()) throw new AppError("Nama lengkap wajib diisi.", 400);

  const taken = await isUsernameTaken(input.username.trim(), id);
  if (taken) throw new AppError("Username sudah digunakan oleh akun lain.", 409);

  await updateAdmin(id, {
    username: input.username.trim(),
    namaLengkap: input.nama_lengkap.trim(),
    email: input.email?.trim() || null,
  });

  if (input.password) {
    if (input.password.length < 6) {
      throw new AppError("Password baru minimal 6 karakter.", 400);
    }
    await updateAdminPassword(id, bcrypt.hashSync(input.password, 10));
  }

  const updated = await findAdminByIdRow(id);
  if (!updated) throw new AppError("Gagal memperbarui akun.", 500);
  return updated;
}

export async function removeUser(id: number, requesterId: number) {
  const existing = await findAdminByIdRow(id);
  if (!existing) throw new AppError("Akun tidak ditemukan.", 404);

  if (id === requesterId) {
    throw new AppError("Anda tidak dapat menghapus akun yang sedang digunakan.", 400);
  }

  const total = await countAdmins();
  if (total <= 1) {
    throw new AppError("Tidak dapat menghapus admin terakhir yang tersisa.", 400);
  }

  await deleteAdminById(id);
}
