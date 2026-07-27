import { AppError } from "../utils/AppError.js";
import { generateKodeAkses } from "../utils/generateKodeAkses.js";
import {
  findAllPraktikum,
  findPraktikumById,
  insertPraktikum,
  updatePraktikumById,
  updateStatusById,
  deactivateAllExcept,
  countPesertaByPraktikum,
  deletePraktikumById,
  isKodeAksesTaken,
} from "../models/praktikum.model.js";
import type { Praktikum, PraktikumInput, StatusPraktikum } from "../types/praktikum.types.js";

function validateJadwal(jadwalMulai: string, jadwalBerakhir: string) {
  const mulai = new Date(jadwalMulai).getTime();
  const berakhir = new Date(jadwalBerakhir).getTime();

  if (Number.isNaN(mulai) || Number.isNaN(berakhir)) {
    throw new AppError("Format jadwal mulai/berakhir tidak valid.", 400);
  }
  if (berakhir <= mulai) {
    throw new AppError("Jadwal berakhir harus lebih besar dari jadwal mulai.", 400);
  }
}

function validateRequiredFields(input: PraktikumInput) {
  if (!input.judul?.trim()) throw new AppError("Judul praktikum wajib diisi.", 400);
  if (!input.mata_kuliah?.trim()) throw new AppError("Mata kuliah wajib diisi.", 400);
  if (!input.instruksi?.trim()) throw new AppError("Instruksi pengerjaan wajib diisi.", 400);
  if (!input.durasi_menit || input.durasi_menit <= 0) {
    throw new AppError("Timer pengerjaan harus lebih dari 0 menit.", 400);
  }
  if (!input.jadwal_mulai || !input.jadwal_berakhir) {
    throw new AppError("Jadwal mulai dan berakhir wajib diisi.", 400);
  }
}

async function resolveKodeAkses(input: PraktikumInput, excludeId?: number): Promise<string> {
  const requested = input.kode_akses?.trim();

  if (requested) {
    const taken = await isKodeAksesTaken(requested, excludeId);
    if (taken) {
      throw new AppError("Kode akses sudah digunakan oleh praktikum lain.", 409);
    }
    return requested;
  }

  // Auto-generate & pastikan unik
  let generated = generateKodeAkses();
  while (await isKodeAksesTaken(generated, excludeId)) {
    generated = generateKodeAkses();
  }
  return generated;
}

export async function listPraktikum(): Promise<Praktikum[]> {
  return findAllPraktikum();
}

export async function createPraktikum(
  input: PraktikumInput,
  idAdmin: number
): Promise<Praktikum> {
  validateRequiredFields(input);
  validateJadwal(input.jadwal_mulai, input.jadwal_berakhir);
  const kodeAkses = await resolveKodeAkses(input);

  const newId = await insertPraktikum({ ...input, kode_akses: kodeAkses, id_admin: idAdmin });

  if (input.status === "aktif") {
    await deactivateAllExcept(newId);
  }

  const created = await findPraktikumById(newId);
  if (!created) throw new AppError("Gagal membuat praktikum.", 500);
  return created;
}

export async function updatePraktikum(
  id: number,
  input: PraktikumInput
): Promise<Praktikum> {
  const existing = await findPraktikumById(id);
  if (!existing) throw new AppError("Praktikum tidak ditemukan.", 404);

  validateRequiredFields(input);
  validateJadwal(input.jadwal_mulai, input.jadwal_berakhir);
  const kodeAkses = await resolveKodeAkses(input, id);

  await updatePraktikumById(id, { ...input, kode_akses: kodeAkses });

  const updated = await findPraktikumById(id);
  if (!updated) throw new AppError("Gagal memperbarui praktikum.", 500);
  return updated;
}

export async function setPraktikumStatus(
  id: number,
  status: StatusPraktikum
): Promise<Praktikum> {
  const existing = await findPraktikumById(id);
  if (!existing) throw new AppError("Praktikum tidak ditemukan.", 404);

  await updateStatusById(id, status);
  if (status === "aktif") {
    // Aturan bisnis: hanya satu praktikum aktif pada satu waktu.
    await deactivateAllExcept(id);
  }

  const updated = await findPraktikumById(id);
  if (!updated) throw new AppError("Gagal memperbarui status praktikum.", 500);
  return updated;
}

export async function removePraktikum(id: number): Promise<void> {
  const existing = await findPraktikumById(id);
  if (!existing) throw new AppError("Praktikum tidak ditemukan.", 404);

  const jumlahPeserta = await countPesertaByPraktikum(id);
  if (jumlahPeserta > 0) {
    throw new AppError(
      `Praktikum tidak dapat dihapus karena masih memiliki ${jumlahPeserta} data peserta terkait.`,
      409
    );
  }

  await deletePraktikumById(id);
}
