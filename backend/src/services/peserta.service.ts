import { AppError } from "../utils/AppError.js";
import { findActivePraktikum } from "../models/praktikum.model.js";
import {
  findPraktikumByKodeAkses,
  insertPeserta,
  findPesertaById,
  insertViolationLog,
  insertActivityLog,
  insertSubmission,
} from "../models/peserta.model.js";
import type { PraktikumPublic } from "../types/peserta.types.js";

function toPublicPraktikum(p: {
  id_praktikum: number;
  judul: string;
  mata_kuliah: string;
  deskripsi: string | null;
  instruksi: string;
  starter_code: string | null;
  contoh_input: string | null;
  contoh_output: string | null;
  bahasa: "javascript" | "typescript";
  tingkat_kesulitan: "mudah" | "sedang" | "sulit";
  durasi_menit: number;
  kode_akses: string;
  jadwal_berakhir: string;
}): PraktikumPublic {
  return {
    id_praktikum: p.id_praktikum,
    judul: p.judul,
    mata_kuliah: p.mata_kuliah,
    deskripsi: p.deskripsi,
    instruksi: p.instruksi,
    starter_code: p.starter_code,
    contoh_input: p.contoh_input,
    contoh_output: p.contoh_output,
    bahasa: p.bahasa,
    tingkat_kesulitan: p.tingkat_kesulitan,
    durasi_menit: p.durasi_menit,
    kode_akses: p.kode_akses,
    jadwal_berakhir: p.jadwal_berakhir,
  };
}

export async function getAktifPraktikumPublic(): Promise<PraktikumPublic | null> {
  const aktif = await findActivePraktikum();
  if (!aktif) return null;

  // Praktikum aktif tapi jadwalnya sudah lewat: perlakukan seolah tidak ada sesi.
  if (new Date(aktif.jadwal_berakhir).getTime() <= Date.now()) return null;

  return toPublicPraktikum(aktif);
}

export async function registerPeserta(input: {
  kode_akses: string;
  nim: string;
  nama: string;
}): Promise<{ id_peserta: number; waktu_mulai: string; praktikum: PraktikumPublic }> {
  const kodeAkses = input.kode_akses?.trim();
  const nim = input.nim?.trim();
  const nama = input.nama?.trim();

  if (!kodeAkses || !nim || !nama) {
    throw new AppError("Kode akses, NIM, dan nama lengkap wajib diisi.", 400);
  }

  const praktikum = await findPraktikumByKodeAkses(kodeAkses);
  if (!praktikum) {
    throw new AppError("Kode akses praktikum tidak ditemukan.", 404);
  }
  if (praktikum.status !== "aktif") {
    throw new AppError("Praktikum ini sedang tidak diaktifkan oleh dosen/laboran.", 403);
  }
  if (new Date(praktikum.jadwal_berakhir).getTime() <= Date.now()) {
    throw new AppError("Jadwal praktikum sudah berakhir. Praktikum tidak dapat diakses lagi.", 403);
  }

  const { id_peserta, waktu_mulai } = await insertPeserta({
    id_praktikum: praktikum.id_praktikum,
    nim,
    nama,
  });

  return {
    id_peserta,
    waktu_mulai,
    praktikum: toPublicPraktikum(praktikum),
  };
}

export async function recordViolation(idPeserta: number, jenisPelanggaran: string): Promise<void> {
  const peserta = await findPesertaById(idPeserta);
  if (!peserta) throw new AppError("Peserta tidak ditemukan.", 404);
  if (peserta.status === "selesai") return; // sesi sudah berakhir, abaikan

  await insertViolationLog(idPeserta, jenisPelanggaran);
}

export async function submitPraktikum(
  idPeserta: number,
  kodeProgram: string,
  submitType: "manual" | "auto"
): Promise<{ waktu_submit: string }> {
  const peserta = await findPesertaById(idPeserta);
  if (!peserta) throw new AppError("Peserta tidak ditemukan.", 404);
  if (peserta.status === "selesai") {
    throw new AppError("Praktikum ini sudah pernah dikirim sebelumnya.", 409);
  }

  const durasiDetik = Math.max(
    0,
    Math.round((Date.now() - new Date(peserta.waktu_mulai).getTime()) / 1000)
  );

  await insertSubmission(idPeserta, kodeProgram, submitType, durasiDetik);
  await insertActivityLog(
    idPeserta,
    submitType === "manual" ? "submit" : "auto_submit",
    `Durasi pengerjaan ${durasiDetik} detik`
  );

  return { waktu_submit: new Date().toISOString() };
}
