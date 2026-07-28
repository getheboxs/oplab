import { AppError } from "../utils/AppError.js";
import { findActivePraktikum } from "../models/praktikum.model.js";
import { findPraktikumByKodeAkses, insertPeserta } from "../models/peserta.model.js";
import type { PraktikumPublic } from "../types/peserta.types.js";

function toPublicPraktikum(p: {
  id_praktikum: number;
  judul: string;
  mata_kuliah: string;
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
